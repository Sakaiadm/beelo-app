-- Rodada 4: regras por tarefa (pode adiar, exige foto, exige justificativa). Tudo desligado por padrão em tarefas novas.
alter table public.ra_tarefas add column if not exists permite_adiar boolean not null default false;
alter table public.ra_tarefas add column if not exists exige_justificativa boolean not null default false;
-- tarefas que já existiam continuam podendo ser adiadas (como era antes)
update public.ra_tarefas set permite_adiar = true where permite_adiar = false and criado_em < now();

create or replace function public.ra_pedir_adiamento(p_oc uuid, p_data date, p_hora time, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas;
begin
  if char_length(coalesce(p_motivo,'')) < 3 then raise exception 'Escreva o motivo'; end if;
  if p_data < (now() at time zone 'America/Sao_Paulo')::date then raise exception 'A nova data deve ser hoje ou depois'; end if;
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = public.ra_meu_id() and status in ('pendente');
  if not found then raise exception 'Não é possível pedir adiamento'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  if not t.permite_adiar then raise exception 'Esta tarefa não pode ser adiada'; end if;
  insert into public.ra_adiamentos(ocorrencia_id, familia_id, membro_id, nova_data, nova_hora, motivo)
  values (p_oc, o.familia_id, o.membro_id, p_data, p_hora, left(p_motivo, 500));
  update public.ra_ocorrencias set status = 'adiamento_pedido' where id = p_oc;
  perform public.ra_notificar_gestores_tipo(o.familia_id, 'adiamento', (select nome from public.ra_membros where id = o.membro_id) || ' pediu adiamento: ' || t.titulo, '/painel');
  perform public.ra_log('pedir_adiamento', jsonb_build_object('ocorrencia', p_oc, 'nova_data', p_data));
end $$;

-- Concluir: tarefa atrasada que exige justificativa só conclui depois de justificada.
create or replace function public.ra_concluir2(p_oc uuid, p_foto text, p_foto_em timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas; me uuid := public.ra_meu_id(); fam uuid := public.ra_minha_familia();
        v_nome text; v_agora timestamp := now() at time zone 'America/Sao_Paulo'; v_dia_foto date;
begin
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = me;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  if t.exige_foto and coalesce(p_foto,'') = '' then raise exception 'Esta tarefa exige foto'; end if;
  if t.exige_justificativa and o.data < v_agora::date and coalesce(o.justificativa,'') = '' then
    raise exception 'Justifique o atraso antes de concluir';
  end if;
  if p_foto is not null then
    if p_foto not like fam::text || '/' || me::text || '/%' then raise exception 'Foto inválida'; end if;
    if p_foto_em is null or p_foto_em > now() + interval '15 minutes' then
      raise exception 'A foto precisa ser de hoje. Tire uma foto nova.';
    end if;
    v_dia_foto := (p_foto_em at time zone 'America/Sao_Paulo')::date;
    if not (v_dia_foto = v_agora::date or (v_dia_foto = v_agora::date - 1 and v_agora::time < time '07:00')) then
      raise exception 'A foto precisa ser de hoje. Tire uma foto nova.';
    end if;
  end if;
  update public.ra_ocorrencias set status = 'cumprida', concluida_em = now(), foto_path = coalesce(p_foto, foto_path),
         foto_tirada_em = case when p_foto is not null then p_foto_em else foto_tirada_em end, conferido = null
   where id = p_oc;
  select m.nome into v_nome from public.ra_membros m where m.id = me;
  perform public.ra_notificar_gestores_tipo(o.familia_id, 'concluida',
    v_nome || ' concluiu: ' || t.titulo || case when p_foto is not null then ' (com foto)' else '' end, '/painel', p_foto is not null);
  perform public.ra_log('concluir', jsonb_build_object('ocorrencia', p_oc));
end $$;
