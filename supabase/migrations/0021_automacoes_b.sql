-- beelo 0021 parte B (lote 6 da auditoria): os avisos e ações automáticas. Pode rodar mais de uma vez.
-- Rode DEPOIS da parte A. Mantém tudo que a função já fazia (lembrete das prioritárias e do tempo de tela)
-- e soma: resumo do dia (U52), conferir sozinho (U53), convite parado (U78) e prêmio esperando (U99).
create or replace function public.ra_gerar_lembretes() returns int
language plpgsql security definer set search_path = public as $$
declare v_agora timestamp := now() at time zone 'America/Sao_Paulo'; n int := 0; r record; v_txt text; v_ped int; v_seg numeric;
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
  return n;
end $$;
revoke execute on function public.ra_gerar_lembretes() from public, anon, authenticated;

notify pgrst, 'reload schema';
