-- @migracao 0027: Aviso de chegada ("Cheguei" / "Tudo certo"). Pode rodar mais de uma vez.
-- @altera   ra_tarefas (+2 colunas), ra_ocorrencias (+1 coluna), regra de "especial", ra_minhas_notif, ra_gerar_lembretes.
-- @rpc      nova: ra_cheguei(p_oc). Alteradas: ra_minhas_notif, ra_gerar_lembretes (mantém tudo que já fazia).
-- @decisao  Chegada é uma tarefa com especial = 'chegada' (mesma ideia do tempo de tela). Um toque marca como feita,
--           grava a hora e avisa os responsáveis ("Alice chegou na escola, 7h28"). Sem localização, sem rastreio.
--           Lembrete suave só para a pessoa (15 min depois do horário); "ainda sem confirmação" aos responsáveis
--           é opcional por tarefa (30 min depois). O aviso respeita a chave "Chegadas" de cada responsável.
-- @cuidado  Dia que passou sem toque vira "cancelada" em silêncio: não aparece atrasada nem conta contra nenhum desafio.

alter table public.ra_tarefas add column if not exists chegada_lembrar boolean not null default true;
alter table public.ra_tarefas add column if not exists chegada_avisar_pais boolean not null default false;
alter table public.ra_ocorrencias add column if not exists chegada_pais_em timestamptz;
alter table public.ra_tarefas drop constraint if exists ra_tarefas_especial_chk;
alter table public.ra_tarefas add constraint ra_tarefas_especial_chk check (especial is null or especial in ('tela', 'chegada'));

-- O toque de chegada: marca como feita (já conferida), grava a hora e avisa os responsáveis.
create or replace function public.ra_cheguei(p_oc uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas; me uuid := public.ra_meu_id(); v_nome text;
        v_agora timestamp := now() at time zone 'America/Sao_Paulo'; v_desc text;
begin
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = me;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  if t.especial is distinct from 'chegada' then raise exception 'Esta tarefa não é de chegada'; end if;
  if o.status = 'cumprida' then return; end if;
  if o.data <> v_agora::date then raise exception 'O aviso de chegada vale só no próprio dia.'; end if;
  update public.ra_ocorrencias set status = 'cumprida', concluida_em = now(), conferido = 'conferido' where id = p_oc;
  select m.nome into v_nome from public.ra_membros m where m.id = me;
  v_desc := case when t.titulo ~* '^chegar +' then regexp_replace(t.titulo, '^chegar +', 'chegou ', 'i') else 'avisou: ' || t.titulo end;
  perform public.ra_notificar_gestores_tipo(o.familia_id, 'chegada', v_nome || ' ' || v_desc || ', ' || to_char(v_agora, 'HH24"h"MI'), '/painel');
  perform public.ra_log('cheguei', jsonb_build_object('ocorrencia', p_oc));
end $$;
grant execute on function public.ra_cheguei(uuid) to authenticated;

-- Avisos de cada pessoa: soma a chave "chegada" (padrão ligada) sem apagar o resto.
create or replace function public.ra_minhas_notif(p_prefs jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if coalesce(p_prefs->>'concluida', 'todas') not in ('todas','com_foto','nenhuma') then raise exception 'Opção inválida'; end if;
  update public.ra_membros set notif = coalesce(notif, '{}'::jsonb) || jsonb_build_object(
    'concluida', coalesce(p_prefs->>'concluida', 'todas'),
    'justificativa', coalesce((p_prefs->>'justificativa')::boolean, true),
    'adiamento', coalesce((p_prefs->>'adiamento')::boolean, true),
    'tela', coalesce((p_prefs->>'tela')::boolean, true),
    'tarefa_filho', coalesce((p_prefs->>'tarefa_filho')::boolean, true),
    'chegada', coalesce((p_prefs->>'chegada')::boolean, true))
  where id = me.id;
end $$;
grant execute on function public.ra_minhas_notif(jsonb) to authenticated;

-- Lembretes automáticos: tudo que já existia (0021 parte B) mais a chegada.
create or replace function public.ra_gerar_lembretes() returns int
language plpgsql security definer set search_path = public as $$
declare v_agora timestamp := now() at time zone 'America/Sao_Paulo'; n int := 0; r record; v_txt text; v_ped int; v_seg numeric; v_desc text;
begin
  for r in
    select o.id, o.familia_id, o.membro_id, o.hora_inicio, t.titulo, t.lembrete_min
      from public.ra_ocorrencias o join public.ra_tarefas t on t.id = o.tarefa_id
     where o.data = v_agora::date and o.status = 'pendente' and o.lembrete_em is null and o.hora_inicio is not null
       and t.prioritaria and t.ativa and t.lembrete_min is not null
       and v_agora >= (o.data + o.hora_inicio) - make_interval(mins => t.lembrete_min)
       and v_agora < (o.data + o.hora_inicio)
     for update of o skip locked
  loop
    insert into public.ra_notificacoes (familia_id, para_membro, titulo, link)
    values (r.familia_id, r.membro_id,
            'Daqui a ' || case when r.lembrete_min = 60 then '1 h' else r.lembrete_min || ' min' end || ': ' || r.titulo
              || ' (às ' || to_char(r.hora_inicio, 'HH24:MI') || ')', '/hoje');
    update public.ra_ocorrencias set lembrete_em = now() where id = r.id;
    n := n + 1;
  end loop;

  -- Lançar tempo de tela: aviso na hora marcada (até 30 min depois, se o envio atrasar).
  for r in
    select o.id, o.familia_id, o.membro_id
      from public.ra_ocorrencias o join public.ra_tarefas t on t.id = o.tarefa_id
     where o.data = v_agora::date and o.status = 'pendente' and o.lembrete_em is null and o.hora_inicio is not null
       and t.especial = 'tela' and t.ativa
       and v_agora >= (o.data + o.hora_inicio)
       and v_agora < (o.data + o.hora_inicio) + interval '30 minutes'
     for update of o skip locked
  loop
    insert into public.ra_notificacoes (familia_id, para_membro, titulo, link)
    values (r.familia_id, r.membro_id, 'Hora de lançar o tempo de tela', '/tela');
    update public.ra_ocorrencias set lembrete_em = now() where id = r.id;
    n := n + 1;
  end loop;

  -- U52: resumo do dia para quem escolheu a hora (até 2 horas depois, se o envio atrasar). Um por dia.
  v_seg := extract(epoch from v_agora::time);
  for r in
    select m.id, m.familia_id, (m.notif->>'resumo_hora')::time as hora
      from public.ra_membros m
     where m.papel = 'gestor' and m.ativo and coalesce(m.notif->>'resumo_hora', '') <> ''
       and coalesce(m.notif->>'resumo_em', '') <> v_agora::date::text
       and v_seg >= extract(epoch from (m.notif->>'resumo_hora')::time)
       and v_seg < extract(epoch from (m.notif->>'resumo_hora')::time) + 7200
  loop
    select string_agg(q.nome || ' ' || q.f || ' de ' || q.tot, ', ' order by q.nome) into v_txt from (
      select p.nome, count(*) filter (where o.status = 'cumprida') as f, count(*) as tot
        from public.ra_membros p join public.ra_ocorrencias o on o.membro_id = p.id and o.data = v_agora::date and o.status not in ('adiada', 'cancelada')
       where p.familia_id = r.familia_id and p.ativo group by p.id, p.nome) q;
    select (select count(*) from public.ra_adiamentos where familia_id = r.familia_id and status = 'pendente')
         + (select count(*) from public.ra_ocorrencias where familia_id = r.familia_id and justificativa_status = 'pendente')
         + (select count(*) from public.ra_tela_proposta where familia_id = r.familia_id and status = 'pendente') into v_ped;
    if v_txt is not null or v_ped > 0 then
      insert into public.ra_notificacoes (familia_id, para_membro, titulo, link)
      values (r.familia_id, r.id, 'Hoje: ' || coalesce(v_txt, 'nenhuma tarefa') || '.'
        || case when v_ped > 0 then ' ' || v_ped || case when v_ped = 1 then ' pedido esperando.' else ' pedidos esperando.' end else '' end, '/painel');
      n := n + 1;
    end if;
    update public.ra_membros set notif = coalesce(notif, '{}'::jsonb) || jsonb_build_object('resumo_em', v_agora::date::text) where id = r.id;
  end loop;

  -- U53: conferir sozinho depois de 2 dias, só nas tarefas sem foto, nas famílias que ativaram.
  update public.ra_ocorrencias o set conferido = 'conferido'
   where o.status = 'cumprida' and o.conferido is null and o.foto_path is null and o.concluida_em < now() - interval '2 days'
     and exists (select 1 from public.ra_familias f where f.id = o.familia_id and f.conferir_auto);

  -- U78: pessoa convidada que não entrou em 3 dias: avisa os responsáveis uma vez (o reenvio é um toque na ficha).
  for r in
    select m.id, m.familia_id, m.nome from public.ra_membros m
     where m.ativo and m.user_id is null and m.convidado_em is not null and m.convite_lembrado_em is null
       and m.convidado_em < now() - interval '3 days'
  loop
    perform public.ra_notificar_gestores_tipo(r.familia_id, 'convite', r.nome || ' ainda não entrou no beelo. Toque para reenviar o convite.', '/config/pessoas/' || r.id);
    update public.ra_membros set convite_lembrado_em = now() where id = r.id;
    n := n + 1;
  end loop;

  -- U99: prêmio esperando entrega há 3 dias: avisa os responsáveis uma vez.
  for r in
    select p.id, p.familia_id, p.nome, (select nome from public.ra_membros where id = p.membro_id) as quem
      from public.ra_premio_pedidos p
     where p.status = 'pedido' and p.lembrado_em is null and p.criado_em < now() - interval '3 days'
  loop
    perform public.ra_notificar_gestores_tipo(r.familia_id, 'premio',
      coalesce(r.quem, 'A família') || ' está esperando o prêmio: ' || r.nome, '/desafios#premios');
    update public.ra_premio_pedidos set lembrado_em = now() where id = r.id;
    n := n + 1;
  end loop;

  -- 0027 · Chegada: o dia que passou sem toque some em silêncio (sem culpa, não conta como falta em nada).
  update public.ra_ocorrencias o set status = 'cancelada'
    from public.ra_tarefas t
   where t.id = o.tarefa_id and t.especial = 'chegada' and o.status = 'pendente' and o.data < v_agora::date;

  -- 0027 · Chegada, passo 1: 15 min depois do horário, um lembrete suave só para a pessoa (até 2 h depois, se o envio atrasar).
  for r in
    select o.id, o.familia_id, o.membro_id, t.titulo,
           case when m.papel = 'filho' and m.modo_crianca and coalesce(m.jeito, 'divertido') <> 'adultos' then 'Cheguei' else 'Tudo certo' end as botao
      from public.ra_ocorrencias o join public.ra_tarefas t on t.id = o.tarefa_id join public.ra_membros m on m.id = o.membro_id
     where o.data = v_agora::date and o.status = 'pendente' and o.lembrete_em is null and o.hora_inicio is not null
       and t.especial = 'chegada' and t.ativa and t.chegada_lembrar
       and v_agora >= (o.data + o.hora_inicio) + interval '15 minutes'
       and v_agora < (o.data + o.hora_inicio) + interval '2 hours'
     for update of o skip locked
  loop
    v_desc := case when r.titulo ~* '^chegar +' then regexp_replace(r.titulo, '^chegar +', 'chegou ', 'i') else 'chegou: ' || r.titulo end;
    insert into public.ra_notificacoes (familia_id, para_membro, titulo, link)
    values (r.familia_id, r.membro_id, 'Já ' || v_desc || '? Toque em ' || r.botao || ' quando chegar.', '/hoje');
    update public.ra_ocorrencias set lembrete_em = now() where id = r.id;
    n := n + 1;
  end loop;

  -- 0027 · Chegada, passo 2 (só se os pais ligaram na tarefa): 30 min depois do horário, um aviso leve aos responsáveis.
  for r in
    select o.id, o.familia_id, o.hora_inicio, t.titulo, m.nome
      from public.ra_ocorrencias o join public.ra_tarefas t on t.id = o.tarefa_id join public.ra_membros m on m.id = o.membro_id
     where o.data = v_agora::date and o.status = 'pendente' and o.chegada_pais_em is null and o.hora_inicio is not null
       and t.especial = 'chegada' and t.ativa and t.chegada_avisar_pais
       and v_agora >= (o.data + o.hora_inicio) + interval '30 minutes'
       and v_agora < (o.data + o.hora_inicio) + interval '2 hours'
     for update of o skip locked
  loop
    perform public.ra_notificar_gestores_tipo(r.familia_id, 'chegada',
      'Ainda sem confirmação: ' || r.nome || ', ' || r.titulo || ' (esperada às ' || to_char(r.hora_inicio, 'HH24"h"MI') || ')', '/painel');
    update public.ra_ocorrencias set chegada_pais_em = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.ra_gerar_lembretes() from public, anon, authenticated;

notify pgrst, 'reload schema';
