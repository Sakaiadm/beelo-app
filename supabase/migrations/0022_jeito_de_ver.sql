-- beelo 0022: jeito de ver o beelo (Divertido, Calmo, Como os adultos) e idade aproximada.
-- Pode rodar mais de uma vez. Rode ANTES de colocar o app novo no ar (o app antigo continua funcionando).
-- LGPD: guarda só o ano aproximado de nascimento (a idade que o Pai ou a Mãe informam), nunca a data.

alter table public.ra_membros add column if not exists jeito text;
alter table public.ra_membros add column if not exists jeito_livre boolean not null default true;
alter table public.ra_membros add column if not exists idade_ano smallint;

do $$ begin
  alter table public.ra_membros add constraint ra_membros_jeito_ok check (jeito is null or jeito in ('divertido', 'calmo', 'adultos'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.ra_membros add constraint ra_membros_idade_ano_ok check (idade_ano is null or idade_ano between 1990 and 2100);
exception when duplicate_object then null; end $$;

-- Todos do grupo leem; Pai e Mãe gravam no cadastro (a regra de quem altera continua a mesma).
grant select (jeito, jeito_livre, idade_ano) on public.ra_membros to authenticated;
grant insert (jeito, jeito_livre) on public.ra_membros to authenticated;
grant update (jeito, jeito_livre, idade_ano) on public.ra_membros to authenticated;

-- A própria pessoa (no modo criança) troca o jeito em Meu perfil, se os responsáveis deixaram.
create or replace function public.ra_meu_jeito(p_jeito text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if not coalesce(me.modo_crianca, false) then raise exception 'Sem permissão'; end if;
  if not me.jeito_livre then raise exception 'Os responsáveis escolheram este jeito por enquanto.'; end if;
  if p_jeito not in ('divertido', 'calmo', 'adultos') then raise exception 'Jeito inválido'; end if;
  update public.ra_membros set jeito = p_jeito where id = me.id;
end $$;

revoke execute on function public.ra_meu_jeito(text) from public, anon;
grant execute on function public.ra_meu_jeito(text) to authenticated;
