-- Rotina Ativa 0002: famílias com avatar, super admin, avatares, preferências de aviso,
-- foto atual nas tarefas e novas categorias.

-- ============ Colunas novas ============
alter table public.ra_familias add column if not exists avatar text;
alter table public.ra_familias add column if not exists ativa boolean not null default true;
alter table public.ra_familias add column if not exists foto_max_horas int not null default 2 check (foto_max_horas between 1 and 48);
alter table public.ra_membros add column if not exists avatar text;
alter table public.ra_membros add column if not exists notif jsonb not null
  default '{"concluida":"todas","justificativa":true,"adiamento":true,"tela":true,"tarefa_filho":true}'::jsonb;
alter table public.ra_ocorrencias add column if not exists foto_tirada_em timestamptz;

-- ============ Super admin (por e-mail; tabela sem acesso pela API) ============
create table if not exists public.ra_superadmins (
  email text primary key,
  criado_em timestamptz not null default now()
);
alter table public.ra_superadmins enable row level security;
insert into public.ra_superadmins(email) values ('sakaiadm2@gmail.com') on conflict do nothing;

create or replace function public.ra_sou_super() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and exists(select 1 from public.ra_superadmins where email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

-- Membro só vale se a família estiver ativa.
create or replace function public.ra_eu() returns public.ra_membros
language sql stable security definer set search_path = public as $$
  select m.* from public.ra_membros m join public.ra_familias f on f.id = m.familia_id
   where m.user_id = auth.uid() and m.ativo and f.ativa limit 1
$$;
create or replace function public.ra_minha_familia() returns uuid
language sql stable security definer set search_path = public as $$
  select m.familia_id from public.ra_membros m join public.ra_familias f on f.id = m.familia_id
   where m.user_id = auth.uid() and m.ativo and f.ativa limit 1
$$;
create or replace function public.ra_meu_id() returns uuid
language sql stable security definer set search_path = public as $$
  select m.id from public.ra_membros m join public.ra_familias f on f.id = m.familia_id
   where m.user_id = auth.uid() and m.ativo and f.ativa limit 1
$$;
create or replace function public.ra_sou_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ra_membros m join public.ra_familias f on f.id = m.familia_id
                 where m.user_id = auth.uid() and m.ativo and m.papel = 'gestor' and f.ativa)
$$;

-- ============ Categorias padrão ============
create or replace function public.ra_seed_categorias(p_fam uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.ra_categorias(familia_id, nome, cor, ordem)
  select p_fam, c.nome, c.cor, c.ordem
    from (values ('Casa','laranja',1),('Estudo','indigo',2),('Esporte','verde',3),('Lazer','azul',4),('Social','rosa',5),
                 ('Saúde','vermelho',6),('Cuidado pessoal','ciano',7),('Espiritual','amarelo',8),('Financeiro','oliva',9),
                 ('Trabalho/Estágio','marrom',10),('Outros','cinza',99)) as c(nome, cor, ordem)
   where not exists (select 1 from public.ra_categorias x where x.familia_id = p_fam and lower(x.nome) = lower(c.nome))
$$;
do $$ declare f uuid; begin
  for f in select id from public.ra_familias loop perform public.ra_seed_categorias(f); end loop;
end $$;

-- ============ Criar família (autoatendimento e super admin) ============
create or replace function public.ra_criar_familia(p_nome text, p_meu_nome text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fam uuid; v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or v_email = '' then raise exception 'Entre com sua conta primeiro'; end if;
  if exists(select 1 from public.ra_membros where user_id = auth.uid() or lower(email) = v_email) then
    raise exception 'Este e-mail já participa de uma família';
  end if;
  if char_length(trim(coalesce(p_nome,''))) < 2 or char_length(trim(coalesce(p_meu_nome,''))) < 1 then
    raise exception 'Informe o nome da família e o seu nome';
  end if;
  insert into public.ra_familias(nome) values (left(trim(p_nome), 60)) returning id into fam;
  insert into public.ra_membros(familia_id, user_id, email, nome, papel, cor)
  values (fam, auth.uid(), v_email, left(trim(p_meu_nome), 60), 'gestor', '#0f4fae');
  perform public.ra_seed_categorias(fam);
  insert into public.ra_historico(familia_id, acao, detalhe) values (fam, 'criar_familia', jsonb_build_object('email', v_email));
  return fam;
end $$;

create or replace function public.ra_admin_criar_familia(p_nome text, p_gestor_nome text, p_gestor_email text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fam uuid; v_email text := lower(trim(coalesce(p_gestor_email, '')));
begin
  if not public.ra_sou_super() then raise exception 'Apenas o administrador geral'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido'; end if;
  if exists(select 1 from public.ra_membros where lower(email) = v_email) then raise exception 'Este e-mail já participa de uma família'; end if;
  insert into public.ra_familias(nome) values (left(trim(p_nome), 60)) returning id into fam;
  insert into public.ra_membros(familia_id, email, nome, papel, cor)
  values (fam, v_email, left(trim(coalesce(nullif(p_gestor_nome,''), 'Responsável')), 60), 'gestor', '#0f4fae');
  perform public.ra_seed_categorias(fam);
  insert into public.ra_historico(familia_id, acao, detalhe) values (fam, 'admin_criar_familia', jsonb_build_object('gestor', v_email));
  return fam;
end $$;

create or replace function public.ra_admin_ativar_familia(p_id uuid, p_ativa boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_sou_super() then raise exception 'Apenas o administrador geral'; end if;
  if not p_ativa and p_id = (select m.familia_id from public.ra_membros m where m.user_id = auth.uid() limit 1) then
    raise exception 'Você não pode desativar a sua própria família';
  end if;
  update public.ra_familias set ativa = p_ativa where id = p_id;
end $$;

create or replace function public.ra_admin_familias()
returns table(id uuid, nome text, avatar text, ativa boolean, criado_em timestamptz, gestores text,
              n_gestores int, n_filhos int, n_ativos int, tarefas int, oc_30d int, cumpridas_30d int, ultima_acao timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.ra_sou_super() then raise exception 'Apenas o administrador geral'; end if;
  return query
  select f.id, f.nome, f.avatar, f.ativa, f.criado_em,
    (select string_agg(m.nome || coalesce(' <' || m.email || '>', ''), ', ' order by m.nome) from public.ra_membros m where m.familia_id = f.id and m.papel = 'gestor'),
    (select count(*)::int from public.ra_membros m where m.familia_id = f.id and m.papel = 'gestor'),
    (select count(*)::int from public.ra_membros m where m.familia_id = f.id and m.papel = 'filho'),
    (select count(*)::int from public.ra_membros m where m.familia_id = f.id and m.user_id is not null),
    (select count(*)::int from public.ra_tarefas t where t.familia_id = f.id and t.ativa),
    (select count(*)::int from public.ra_ocorrencias o where o.familia_id = f.id and o.data between current_date - 30 and current_date and o.status <> 'cancelada'),
    (select count(*)::int from public.ra_ocorrencias o where o.familia_id = f.id and o.data between current_date - 30 and current_date and o.status = 'cumprida'),
    (select max(h.criado_em) from public.ra_historico h where h.familia_id = f.id)
  from public.ra_familias f order by f.criado_em;
end $$;

-- ============ Perfil: avatar e preferências de aviso ============
create or replace function public.ra_meu_avatar(p_caminho text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if p_caminho is not null and p_caminho not like me.familia_id::text || '/' || me.id::text || '/%' then raise exception 'Imagem inválida'; end if;
  update public.ra_membros set avatar = p_caminho where id = me.id;
end $$;

create or replace function public.ra_minhas_notif(p_prefs jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if coalesce(p_prefs->>'concluida', 'todas') not in ('todas','com_foto','nenhuma') then raise exception 'Opção inválida'; end if;
  update public.ra_membros set notif = jsonb_build_object(
    'concluida', coalesce(p_prefs->>'concluida', 'todas'),
    'justificativa', coalesce((p_prefs->>'justificativa')::boolean, true),
    'adiamento', coalesce((p_prefs->>'adiamento')::boolean, true),
    'tela', coalesce((p_prefs->>'tela')::boolean, true),
    'tarefa_filho', coalesce((p_prefs->>'tarefa_filho')::boolean, true))
  where id = me.id;
end $$;

-- ============ Avisos aos pais conforme a preferência de cada um ============
create or replace function public.ra_notificar_gestores_tipo(p_familia uuid, p_tipo text, p_titulo text, p_link text, p_com_foto boolean default false) returns void
language sql security definer set search_path = public as $$
  insert into public.ra_notificacoes(familia_id, para_membro, titulo, link)
  select p_familia, m.id, p_titulo, p_link from public.ra_membros m
   where m.familia_id = p_familia and m.papel = 'gestor' and m.ativo
     and case when p_tipo = 'concluida'
              then coalesce(m.notif->>'concluida', 'todas') = 'todas' or (m.notif->>'concluida' = 'com_foto' and p_com_foto)
              else coalesce((m.notif->>p_tipo)::boolean, true) end
$$;

-- Conclusão com foto atual (a data em que a foto foi tirada vem do aparelho).
create or replace function public.ra_concluir2(p_oc uuid, p_foto text, p_foto_em timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas; me uuid := public.ra_meu_id(); fam uuid := public.ra_minha_familia();
        lim int; v_nome text;
begin
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = me;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  if t.exige_foto and coalesce(p_foto,'') = '' then raise exception 'Esta tarefa exige foto'; end if;
  if p_foto is not null then
    if p_foto not like fam::text || '/' || me::text || '/%' then raise exception 'Foto inválida'; end if;
    select foto_max_horas into lim from public.ra_familias where id = fam;
    if p_foto_em is null or p_foto_em < now() - make_interval(hours => lim) or p_foto_em > now() + interval '15 minutes' then
      raise exception 'A foto precisa ter sido tirada agora (nas últimas % h). Tire uma foto nova.', lim;
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

-- A versão antiga passa a valer só sem foto (foto exige a data de quando foi tirada).
create or replace function public.ra_concluir(p_oc uuid, p_foto text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.ra_concluir2(p_oc, p_foto, null);
end $$;

create or replace function public.ra_justificar(p_oc uuid, p_texto text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas;
begin
  if char_length(coalesce(p_texto,'')) < 3 then raise exception 'Escreva a justificativa'; end if;
  update public.ra_ocorrencias set justificativa = left(p_texto, 500), justificativa_status = 'pendente', justificada_em = now()
   where id = p_oc and membro_id = public.ra_meu_id() returning * into o;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  perform public.ra_notificar_gestores_tipo(o.familia_id, 'justificativa', (select nome from public.ra_membros where id = o.membro_id) || ' justificou: ' || t.titulo, '/painel');
  perform public.ra_log('justificar', jsonb_build_object('ocorrencia', p_oc));
end $$;

create or replace function public.ra_pedir_adiamento(p_oc uuid, p_data date, p_hora time, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas;
begin
  if char_length(coalesce(p_motivo,'')) < 3 then raise exception 'Escreva o motivo'; end if;
  if p_data < (now() at time zone 'America/Sao_Paulo')::date then raise exception 'A nova data deve ser hoje ou depois'; end if;
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = public.ra_meu_id() and status in ('pendente');
  if not found then raise exception 'Não é possível pedir adiamento'; end if;
  insert into public.ra_adiamentos(ocorrencia_id, familia_id, membro_id, nova_data, nova_hora, motivo)
  values (p_oc, o.familia_id, o.membro_id, p_data, p_hora, left(p_motivo, 500));
  update public.ra_ocorrencias set status = 'adiamento_pedido' where id = p_oc;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  perform public.ra_notificar_gestores_tipo(o.familia_id, 'adiamento', (select nome from public.ra_membros where id = o.membro_id) || ' pediu adiamento: ' || t.titulo, '/painel');
  perform public.ra_log('pedir_adiamento', jsonb_build_object('ocorrencia', p_oc, 'nova_data', p_data));
end $$;

create or replace function public.ra_propor_tela(p_data date, p_cel int, p_pc int, p_total int, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null or me.papel <> 'filho' then raise exception 'Apenas filhos'; end if;
  if char_length(coalesce(p_motivo,'')) < 3 then raise exception 'Escreva o motivo'; end if;
  insert into public.ra_tela_proposta(familia_id, membro_id, data, min_celular, min_computador, min_total, motivo)
  values (me.familia_id, me.id, p_data, p_cel, p_pc, p_total, left(p_motivo, 500));
  perform public.ra_notificar_gestores_tipo(me.familia_id, 'tela', me.nome || ' propôs outro previsto de tela', '/tela');
end $$;

create or replace function public.ra_tg_tarefa_nova() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.criada_por <> new.responsavel_id then
    perform public.ra_notificar(new.familia_id, new.responsavel_id, 'Nova tarefa: ' || new.titulo, '/hoje');
  else
    perform public.ra_notificar_gestores_tipo(new.familia_id, 'tarefa_filho',
      (select nome from public.ra_membros where id = new.responsavel_id) || ' criou a tarefa: ' || new.titulo, '/tarefas');
  end if;
  insert into public.ra_historico(familia_id, membro_id, acao, detalhe)
  values (new.familia_id, new.criada_por, 'criar_tarefa', jsonb_build_object('tarefa', new.id, 'titulo', new.titulo));
  return new;
end $$;

-- ============ Avatares (bucket privado próprio) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rotina-avatares', 'rotina-avatares', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy ra_avatar_ins on storage.objects for insert to authenticated with check (
  bucket_id = 'rotina-avatares'
  and (storage.foldername(name))[1] = public.ra_minha_familia()::text
  and ((storage.foldername(name))[2] = public.ra_meu_id()::text or public.ra_sou_gestor()));
create policy ra_avatar_sel on storage.objects for select to authenticated using (
  bucket_id = 'rotina-avatares'
  and ((storage.foldername(name))[1] = public.ra_minha_familia()::text or public.ra_sou_super()));

-- ============ Permissões das funções ============
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'ra\_%' loop
    execute 'revoke execute on function ' || f || ' from public, anon';
    execute 'grant execute on function ' || f || ' to authenticated';
  end loop;
end $$;
revoke execute on function public.ra_notificar(uuid, uuid, text, text) from authenticated;
revoke execute on function public.ra_notificar_gestores(uuid, text, text) from authenticated;
revoke execute on function public.ra_notificar_gestores_tipo(uuid, text, text, text, boolean) from authenticated;
revoke execute on function public.ra_log(text, jsonb) from authenticated;
revoke execute on function public.ra_seed_categorias(uuid) from authenticated;
revoke execute on function public.ra_tg_tarefa_nova() from authenticated;
revoke execute on function public.ra_tg_tela_real() from authenticated;
