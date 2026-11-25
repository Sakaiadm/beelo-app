-- 0029: trocar a foto de uma tarefa já concluída e apagar as fotos que sobram (seção 42 da fila de ideias).
-- @banco ra_ocorrencias.foto_trocada_em (nova coluna); storage.objects (nova política de apagar)
-- @rpc ra_trocar_foto (a própria pessoa, até o responsável conferir; devolve o caminho da foto antiga)
-- @regra a foto nova também precisa ser de hoje (mesma regra de concluir). A conclusão e a hora da conclusão não mudam.
-- @cuidado a política de apagar só vale para fotos da própria pessoa que NÃO estão em nenhuma tarefa. Fotos em uso nunca são apagadas por ela.

alter table public.ra_ocorrencias add column if not exists foto_trocada_em timestamptz;

create or replace function public.ra_trocar_foto(p_oc uuid, p_foto text, p_foto_em timestamptz) returns text
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas; me uuid := public.ra_meu_id(); fam uuid := public.ra_minha_familia();
        v_nome text; v_agora timestamp := now() at time zone 'America/Sao_Paulo'; v_dia_foto date; v_antiga text;
begin
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = me;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  if o.status not in ('cumprida', 'cumprida_atraso') or o.foto_path is null then raise exception 'Só dá para trocar a foto de uma tarefa já concluída com foto'; end if;
  if o.conferido is not null then raise exception 'O responsável já conferiu. A foto não pode mais ser trocada'; end if;
  if coalesce(p_foto, '') = '' or p_foto not like fam::text || '/' || me::text || '/%' then raise exception 'Foto inválida'; end if;
  if p_foto_em is null or p_foto_em > now() + interval '15 minutes' then raise exception 'A foto precisa ser de hoje. Tire uma foto nova.'; end if;
  v_dia_foto := (p_foto_em at time zone 'America/Sao_Paulo')::date;
  if not (v_dia_foto = v_agora::date or (v_dia_foto = v_agora::date - 1 and v_agora::time < time '07:00')) then
    raise exception 'A foto precisa ser de hoje. Tire uma foto nova.';
  end if;
  v_antiga := o.foto_path;
  update public.ra_ocorrencias set foto_path = p_foto, foto_tirada_em = p_foto_em, foto_trocada_em = now() where id = p_oc;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  select m.nome into v_nome from public.ra_membros m where m.id = me;
  -- Avisa só quem ligou o aviso de conclusão (mesmo tipo de "concluiu").
  perform public.ra_notificar_gestores_tipo(o.familia_id, 'concluida', v_nome || ' trocou a foto: ' || t.titulo, '/painel', true);
  perform public.ra_log('trocar_foto', jsonb_build_object('ocorrencia', p_oc));
  return v_antiga;
end $$;

revoke execute on function public.ra_trocar_foto(uuid, text, timestamptz) from public, anon;
grant execute on function public.ra_trocar_foto(uuid, text, timestamptz) to authenticated;

-- Apagar fotos próprias que sobraram (trocadas antes de concluir, ou a antiga depois de trocar).
drop policy if exists ra_foto_del on storage.objects;
create policy ra_foto_del on storage.objects for delete to authenticated using (
  bucket_id = 'rotina-fotos'
  and (storage.foldername(name))[1] = public.ra_minha_familia()::text
  and (storage.foldername(name))[2] = public.ra_meu_id()::text
  and not exists (select 1 from public.ra_ocorrencias o where o.foto_path = storage.objects.name));
