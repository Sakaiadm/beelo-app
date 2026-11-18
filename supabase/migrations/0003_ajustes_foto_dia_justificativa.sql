-- Rodada 3: foto vale se for do dia (até 7h do dia seguinte), justificativa configurável, avatares prontos.

alter table public.ra_familias add column if not exists justificativa_obrigatoria boolean not null default false;

-- Foto: precisa ser do dia de hoje (horário de Brasília). Até 7h da manhã ainda vale a foto de ontem.
create or replace function public.ra_concluir2(p_oc uuid, p_foto text, p_foto_em timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas; me uuid := public.ra_meu_id(); fam uuid := public.ra_minha_familia();
        v_nome text; v_agora timestamp := now() at time zone 'America/Sao_Paulo'; v_dia_foto date;
begin
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = me;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  if t.exige_foto and coalesce(p_foto,'') = '' then raise exception 'Esta tarefa exige foto'; end if;
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

-- Avatar do próprio perfil: foto enviada (na pasta da pessoa) ou avatar pronto ("preset:m1", "preset:d3").
create or replace function public.ra_meu_avatar(p_caminho text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if p_caminho is not null and p_caminho !~ '^preset:[md][0-9]{1,2}$'
     and p_caminho not like me.familia_id::text || '/' || me.id::text || '/%' then raise exception 'Imagem inválida'; end if;
  update public.ra_membros set avatar = p_caminho where id = me.id;
end $$;
