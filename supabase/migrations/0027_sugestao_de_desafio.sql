-- 0027: a criança sugere um desafio e Pai e Mãe aprovam (criando o desafio) ou dizem "agora não".
-- @banco ra_desafio_sugestoes (nova)
-- @rpc ra_desafio_sugerir (criança), ra_desafio_sugestao_fechar (Pai e Mãe)
-- @cuidado Ninguém grava na tabela direto: só pelas duas funções. A criança só vê as próprias sugestões.

create table if not exists public.ra_desafio_sugestoes (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid not null references public.ra_membros(id) on delete cascade,
  catalogo text not null,
  titulo text not null,
  status text not null default 'esperando' check (status in ('esperando', 'criado', 'agora_nao')),
  criado_em timestamptz not null default now()
);
create index if not exists ra_desafio_sugestoes_familia on public.ra_desafio_sugestoes(familia_id, status);

alter table public.ra_desafio_sugestoes enable row level security;
drop policy if exists ra_dsug_sel on public.ra_desafio_sugestoes;
create policy ra_dsug_sel on public.ra_desafio_sugestoes for select
  using (familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id = public.ra_meu_id()));

-- A criança sugere (até 2 esperando, sem repetir o mesmo desafio). Avisa Pai e Mãe.
create or replace function public.ra_desafio_sugerir(p_catalogo text, p_titulo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); v_titulo text := left(btrim(coalesce(p_titulo, '')), 120); v_id uuid;
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if me.papel <> 'filho' then raise exception 'Quem sugere é a criança'; end if;
  if not coalesce((select desafios_beta from public.ra_familias where id = me.familia_id), false) then raise exception 'Os desafios estão desligados'; end if;
  if v_titulo = '' or btrim(coalesce(p_catalogo, '')) = '' then raise exception 'Escolha um desafio'; end if;
  perform pg_advisory_xact_lock(hashtext('dsug' || me.id::text));
  if exists (select 1 from public.ra_desafio_sugestoes where membro_id = me.id and status = 'esperando' and catalogo = p_catalogo) then
    raise exception 'Você já sugeriu este desafio. Espere a resposta dos pais.';
  end if;
  if (select count(*) from public.ra_desafio_sugestoes where membro_id = me.id and status = 'esperando') >= 2 then
    raise exception 'Você já tem 2 sugestões esperando os pais.';
  end if;
  insert into public.ra_desafio_sugestoes(familia_id, membro_id, catalogo, titulo) values (me.familia_id, me.id, p_catalogo, v_titulo) returning id into v_id;
  perform public.ra_notificar_gestores(me.familia_id, me.nome || ' sugeriu um desafio: ' || v_titulo, '/desafios');
  return v_id;
end $$;

-- Pai ou Mãe fecham a sugestão: 'criado' (viraram desafio) ou 'agora_nao'.
create or replace function public.ra_desafio_sugestao_fechar(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_sou_gestor() then raise exception 'Só os responsáveis podem fazer isso'; end if;
  if p_status not in ('criado', 'agora_nao') then raise exception 'Resposta inválida'; end if;
  update public.ra_desafio_sugestoes set status = p_status
   where id = p_id and familia_id = public.ra_minha_familia() and status = 'esperando';
end $$;

revoke execute on function public.ra_desafio_sugerir(text, text), public.ra_desafio_sugestao_fechar(uuid, text) from public, anon;
grant execute on function public.ra_desafio_sugerir(text, text), public.ra_desafio_sugestao_fechar(uuid, text) to authenticated;

notify pgrst, 'reload schema';
