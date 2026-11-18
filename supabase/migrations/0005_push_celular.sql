-- Rodada 5: avisos no celular (push) e número no ícone.
-- O app na VPS consulta a fila de avisos com um segredo próprio e envia o push; o banco guarda os aparelhos.

create table if not exists public.ra_config (chave text primary key, valor text not null);
alter table public.ra_config enable row level security;   -- sem políticas: ninguém lê pelo app
revoke all on public.ra_config from anon, authenticated;

create table if not exists public.ra_push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  membro_id uuid not null references public.ra_membros(id) on delete cascade,
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) < 2000),
  p256dh text not null,
  auth text not null,
  aparelho text,
  criado_em timestamptz not null default now()
);
create index if not exists ra_push_insc_membro on public.ra_push_inscricoes(membro_id);
alter table public.ra_push_inscricoes enable row level security;
drop policy if exists ra_push_sel on public.ra_push_inscricoes;
create policy ra_push_sel on public.ra_push_inscricoes for select using (membro_id = public.ra_meu_id());
drop policy if exists ra_push_del on public.ra_push_inscricoes;
create policy ra_push_del on public.ra_push_inscricoes for delete using (membro_id = public.ra_meu_id());

alter table public.ra_notificacoes add column if not exists push_em timestamptz;
update public.ra_notificacoes set push_em = now() where push_em is null;   -- avisos antigos não viram push
create index if not exists ra_notif_push_pend on public.ra_notificacoes(criado_em) where push_em is null;

-- Registra o aparelho da própria pessoa.
create or replace function public.ra_push_inscrever(p_endpoint text, p_p256dh text, p_auth text, p_aparelho text default null) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if coalesce(p_endpoint,'') not like 'https://%' or char_length(p_endpoint) >= 2000 or coalesce(p_p256dh,'') = '' or coalesce(p_auth,'') = '' then
    raise exception 'Aparelho inválido';
  end if;
  insert into public.ra_push_inscricoes(membro_id, familia_id, endpoint, p256dh, auth, aparelho)
  values (me.id, me.familia_id, p_endpoint, p_p256dh, p_auth, left(p_aparelho, 80))
  on conflict (endpoint) do update set membro_id = excluded.membro_id, familia_id = excluded.familia_id,
    p256dh = excluded.p256dh, auth = excluded.auth, aparelho = excluded.aparelho;
end $$;

create or replace function public.ra_push_cancelar(p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.ra_push_inscricoes where endpoint = p_endpoint and membro_id = public.ra_meu_id();
end $$;

-- Aviso de teste para a própria pessoa (chega pelo mesmo caminho dos avisos de verdade).
create or replace function public.ra_push_teste() returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  insert into public.ra_notificacoes(familia_id, para_membro, titulo, link)
  values (me.familia_id, me.id, 'Teste: os avisos no celular estão funcionando', '/notificacoes');
end $$;

-- Segredo do servidor da VPS (só guardamos o resumo). Só o administrador do banco (editor SQL) consegue chamar.
create or replace function public.ra_push_definir_segredo(p_segredo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if char_length(coalesce(p_segredo,'')) < 24 then raise exception 'Segredo curto demais'; end if;
  insert into public.ra_config(chave, valor) values ('push_segredo', encode(sha256(convert_to(p_segredo, 'utf8')), 'hex'))
  on conflict (chave) do update set valor = excluded.valor;
end $$;
revoke execute on function public.ra_push_definir_segredo(text) from public, anon, authenticated;

create or replace function public.ra_push_segredo_ok(p_segredo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ra_config where chave = 'push_segredo'
                  and valor = encode(sha256(convert_to(coalesce(p_segredo, ''), 'utf8')), 'hex'))
$$;
revoke execute on function public.ra_push_segredo_ok(text) from public, anon, authenticated;

-- Fila: avisos ainda não enviados, um por aparelho, com o número de não lidas (para o ícone).
create or replace function public.ra_push_pendentes(p_segredo text, p_limite int default 40)
returns table(notif_id uuid, titulo text, link text, endpoint text, p256dh text, auth text, nao_lidas int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_push_segredo_ok(p_segredo) then raise exception 'Acesso negado'; end if;
  -- sem aparelho cadastrado ou muito antigo: nada a enviar
  update public.ra_notificacoes n set push_em = now()
   where n.push_em is null
     and (n.criado_em < now() - interval '1 day'
          or not exists (select 1 from public.ra_push_inscricoes i where i.membro_id = n.para_membro));
  return query
  select n.id, n.titulo, n.link, i.endpoint, i.p256dh, i.auth,
         (select count(*)::int from public.ra_notificacoes x where x.para_membro = n.para_membro and not x.lida)
    from public.ra_notificacoes n
    join public.ra_push_inscricoes i on i.membro_id = n.para_membro
   where n.push_em is null
   order by n.criado_em
   limit greatest(1, least(p_limite, 200));
end $$;

create or replace function public.ra_push_concluir(p_segredo text, p_notif_ids uuid[], p_mortos text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_push_segredo_ok(p_segredo) then raise exception 'Acesso negado'; end if;
  update public.ra_notificacoes set push_em = now() where id = any(coalesce(p_notif_ids, '{}'));
  delete from public.ra_push_inscricoes where endpoint = any(coalesce(p_mortos, '{}'));
end $$;

grant execute on function public.ra_push_inscrever(text, text, text, text) to authenticated;
grant execute on function public.ra_push_cancelar(text) to authenticated;
grant execute on function public.ra_push_teste() to authenticated;
grant execute on function public.ra_push_pendentes(text, int) to anon, authenticated;
grant execute on function public.ra_push_concluir(text, uuid[], text[]) to anon, authenticated;

revoke execute on function public.ra_push_inscrever(text, text, text, text) from anon;
revoke execute on function public.ra_push_cancelar(text) from anon;
revoke execute on function public.ra_push_teste() from anon;
