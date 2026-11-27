-- @migracao 0033: relatos dos testadores (problema ou sugestão)
-- @banco ra_relatos; rpc ra_relatar, ra_relatos_lista, ra_relato_status; política de leitura das fotos para o administrador geral
-- Rodar em 3 pedaços, um por vez, na ordem. Seguro rodar de novo.

-- ═══ PARTE 1: tabela ═══
create table if not exists public.ra_relatos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid references public.ra_membros(id) on delete set null,
  tipo text not null check (tipo in ('problema','sugestao')),
  texto text not null check (char_length(texto) between 5 and 2000),
  foto_path text, tela text, papel text, aparelho text,
  status text not null default 'novo' check (status in ('novo','visto','resolvido')),
  criado_em timestamptz not null default now()
);
alter table public.ra_relatos enable row level security; -- sem política: só pelas funções abaixo

-- ═══ PARTE 2: enviar relato (avisa o administrador geral no sino) ═══
create or replace function public.ra_relatar(p_tipo text, p_texto text, p_foto text, p_tela text, p_papel text, p_aparelho text)
returns void language plpgsql security definer set search_path = public as $$
declare v_eu uuid := public.ra_meu_id(); v_fam uuid := public.ra_minha_familia(); v_nome text;
begin
  if v_eu is null then raise exception 'Entre no beelo primeiro'; end if;
  insert into public.ra_relatos(familia_id, membro_id, tipo, texto, foto_path, tela, papel, aparelho)
  values (v_fam, v_eu, p_tipo, left(p_texto, 2000), p_foto, left(p_tela, 200), left(p_papel, 60), left(p_aparelho, 200));
  select nome into v_nome from public.ra_membros where id = v_eu;
  insert into public.ra_notificacoes(familia_id, para_membro, titulo, link)
  select m.familia_id, m.id, case when p_tipo = 'problema' then 'Novo problema relatado por ' else 'Nova sugestão de ' end || coalesce(v_nome, 'um testador'), '/config/relatos'
    from public.ra_membros m join public.ra_superadmins s on lower(s.email) = lower(m.email) where m.ativo;
end $$;

-- ═══ PARTE 3: lista, andamento e leitura das fotos (só administrador geral) ═══
create or replace function public.ra_relatos_lista()
returns table(id uuid, tipo text, texto text, foto_path text, tela text, papel text, aparelho text, status text, criado_em timestamptz, nome text, familia text)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_sou_super() then raise exception 'Apenas o administrador geral'; end if;
  return query select r.id, r.tipo, r.texto, r.foto_path, r.tela, r.papel, r.aparelho, r.status, r.criado_em, m.nome, f.nome
    from public.ra_relatos r left join public.ra_membros m on m.id = r.membro_id join public.ra_familias f on f.id = r.familia_id
   order by r.criado_em desc limit 300;
end $$;
create or replace function public.ra_relato_status(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_sou_super() then raise exception 'Apenas o administrador geral'; end if;
  update public.ra_relatos set status = p_status where id = p_id and p_status in ('novo','visto','resolvido');
end $$;
drop policy if exists ra_foto_sel_super on storage.objects;
create policy ra_foto_sel_super on storage.objects for select to authenticated using (bucket_id = 'rotina-fotos' and public.ra_sou_super());
