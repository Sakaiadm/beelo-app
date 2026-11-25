-- beelo 0021 parte A (lote 6 da auditoria): colunas e funções novas. Pode rodar mais de uma vez.
-- Rode ANTES de colocar o app novo no ar (o app antigo continua funcionando com estas colunas).

-- Colunas novas
alter table public.ra_familias add column if not exists conferir_auto boolean not null default false;
alter table public.ra_tarefas add column if not exists adiar_livre boolean not null default false;
alter table public.ra_ocorrencias add column if not exists lembrado_em timestamptz;
alter table public.ra_adiamentos add column if not exists livre boolean not null default false;
alter table public.ra_membros add column if not exists convite_lembrado_em timestamptz;
alter table public.ra_premio_pedidos add column if not exists lembrado_em timestamptz;

-- Os avisos de cada pessoa passam a guardar também o resumo do dia (hora e último envio) sem apagar nada.
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
    'tarefa_filho', coalesce((p_prefs->>'tarefa_filho')::boolean, true))
  where id = me.id;
end $$;
grant execute on function public.ra_minhas_notif(jsonb) to authenticated;

-- U52: hora do resumo do dia (vazio = desligado). Só Pai e Mãe.
create or replace function public.ra_meu_resumo(p_hora text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null or me.papel <> 'gestor' then raise exception 'Apenas pais'; end if;
  if coalesce(p_hora, '') <> '' and p_hora !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Hora inválida'; end if;
  update public.ra_membros set notif = coalesce(notif, '{}'::jsonb) || jsonb_build_object('resumo_hora', coalesce(p_hora, ''), 'resumo_em', '')
   where id = me.id;
end $$;
grant execute on function public.ra_meu_resumo(text) to authenticated;

-- U53: conferir sozinho depois de 2 dias (só tarefas sem foto). Vale para a família toda.
create or replace function public.ra_conferir_auto(p_ligar boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_sou_gestor() then raise exception 'Apenas pais'; end if;
  update public.ra_familias set conferir_auto = coalesce(p_ligar, false) where id = public.ra_minha_familia();
end $$;
grant execute on function public.ra_conferir_auto(boolean) to authenticated;

-- U35: botão "Lembrar" numa tarefa atrasada. Um lembrete por tarefa a cada 2 horas.
create or replace function public.ra_lembrar_tarefa(p_oc uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas;
begin
  if not public.ra_sou_gestor() then raise exception 'Apenas pais'; end if;
  select * into o from public.ra_ocorrencias where id = p_oc and familia_id = public.ra_minha_familia() and status = 'pendente';
  if not found then raise exception 'Tarefa não encontrada'; end if;
  if o.lembrado_em is not null and o.lembrado_em > now() - interval '2 hours' then raise exception 'Já lembrei há pouco. Tente daqui a um tempo.'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  perform public.ra_notificar(o.familia_id, o.membro_id, 'Lembrete: ' || t.titulo || ' está esperando você', '/hoje');
  update public.ra_ocorrencias set lembrado_em = now() where id = p_oc;
end $$;
grant execute on function public.ra_lembrar_tarefa(uuid) to authenticated;

-- U54: adiar 1 dia sem pedir, uma vez por semana, nas tarefas em que os pais ativaram essa opção.
create or replace function public.ra_adiar_livre(p_oc uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas; v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
        v_sem timestamptz := date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
begin
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = public.ra_meu_id() and status = 'pendente';
  if not found then raise exception 'Não é possível adiar esta tarefa'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  if not (t.adiar_livre and t.permite_adiar) then raise exception 'Esta tarefa não pode ser adiada sem pedir'; end if;
  if o.data < v_hoje then raise exception 'Só dá para adiar tarefas de hoje ou de dias que vêm'; end if;
  if exists (select 1 from public.ra_adiamentos a where a.membro_id = o.membro_id and a.livre and a.criado_em >= v_sem) then
    raise exception 'Você já adiou uma tarefa sem pedir nesta semana. Peça aos responsáveis.';
  end if;
  insert into public.ra_adiamentos(ocorrencia_id, familia_id, membro_id, nova_data, nova_hora, motivo, status, livre)
  values (o.id, o.familia_id, o.membro_id, o.data + 1, o.hora_inicio, 'Adiou 1 dia sem pedir', 'aprovado', true);
  update public.ra_ocorrencias set status = 'adiada' where id = o.id;
  insert into public.ra_ocorrencias(tarefa_id, familia_id, membro_id, data, hora_inicio, hora_fim, horario_travado)
  values (o.tarefa_id, o.familia_id, o.membro_id, o.data + 1, o.hora_inicio, o.hora_fim, o.horario_travado)
  on conflict (tarefa_id, data) do update set status = 'pendente';
  perform public.ra_notificar_gestores_tipo(o.familia_id, 'adiamento',
    (select nome from public.ra_membros where id = o.membro_id) || ' adiou 1 dia: ' || t.titulo, '/painel');
end $$;
grant execute on function public.ra_adiar_livre(uuid) to authenticated;

notify pgrst, 'reload schema';
