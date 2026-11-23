-- beelo 0014: cor do grupo (escolhida por Pai ou Mãe) e cor escolhida pela própria pessoa em Meu perfil.
-- Pode rodar mais de uma vez.

alter table public.ra_familias add column if not exists cor text not null default '#1a6fe0';

-- Pai ou Mãe do grupo (ou o administrador geral) troca a cor do grupo.
create or replace function public.ra_cor_familia(p_id uuid, p_cor text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if not (public.ra_sou_super() or (me.id is not null and me.papel = 'gestor' and me.familia_id = p_id)) then
    raise exception 'Sem permissão';
  end if;
  if p_cor !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Cor inválida'; end if;
  update public.ra_familias set cor = lower(p_cor) where id = p_id;
end $$;

-- Cada pessoa troca a própria cor em Meu perfil.
create or replace function public.ra_minha_cor(p_cor text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if p_cor !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Cor inválida'; end if;
  update public.ra_membros set cor = lower(p_cor) where id = me.id;
end $$;

-- Cores de todos os grupos, para a lista de grupos do administrador geral.
create or replace function public.ra_admin_cores() returns table(id uuid, cor text)
language sql stable security definer set search_path = public as $$
  select f.id, f.cor from public.ra_familias f where public.ra_sou_super()
$$;

revoke execute on function public.ra_cor_familia(uuid, text), public.ra_minha_cor(text), public.ra_admin_cores() from public, anon;
grant execute on function public.ra_cor_familia(uuid, text), public.ra_minha_cor(text), public.ra_admin_cores() to authenticated;
