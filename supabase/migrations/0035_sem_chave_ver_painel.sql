-- beelo 0035: só Responsável vê o painel da família. A chave "Vê o painel da família" deixa de existir
-- para Acompanhado(a) e Outro. Pode rodar mais de uma vez.
-- 1) Tira a chave guardada de quem não é responsável.
update public.ra_membros set permissoes = permissoes - 'ver_painel'
 where papel <> 'gestor' and permissoes ? 'ver_painel';

-- 2) ra_pode: 'ver_painel' vale só para gestor (antes o supervisor antigo ganhava por padrão).
create or replace function public.ra_pode(p_chave text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.ra_membros m join public.ra_familias f on f.id = m.familia_id
     where m.user_id = auth.uid() and m.ativo and f.ativa
       and (m.papel = 'gestor'
            or (p_chave <> 'ver_painel'
                and coalesce((m.permissoes ->> p_chave)::boolean,
                             m.funcao = 'supervisor' and p_chave in ('conferir', 'ver_relatorios')))))
$$;
grant execute on function public.ra_pode(text) to authenticated;
