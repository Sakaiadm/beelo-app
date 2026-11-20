-- Rotina Ativa 0010: avatares de criança. Pode rodar mais de uma vez. Rode depois da 0009.
-- A própria pessoa troca o avatar em Meu perfil: foto ou imagem (na pasta dela) ou,
-- só com o Modo criança ligado, um dos 30 avatares de criança ("preset:k01" a "preset:k30").
create or replace function public.ra_meu_avatar(p_caminho text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if p_caminho is not null then
    if p_caminho like 'preset:%' then
      if p_caminho !~ '^preset:k(0[1-9]|[12][0-9]|30)$' then raise exception 'Avatar inválido'; end if;
      if not coalesce(me.modo_crianca, false) then raise exception 'Os avatares são só para quem tem o Modo criança ligado'; end if;
    elsif p_caminho not like me.familia_id::text || '/' || me.id::text || '/%' then
      raise exception 'Imagem inválida';
    end if;
  end if;
  update public.ra_membros set avatar = p_caminho where id = me.id;
end $$;
