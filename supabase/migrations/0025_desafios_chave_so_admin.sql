-- @migracao 0025: a chave de ligar/desligar os desafios (beta) passa a ser só do administrador geral.
-- @altera   ra_familias (gatilho em desafios_beta)
-- @regra    Pai/Mãe comuns continuam editando o resto do grupo; só a coluna desafios_beta fica travada.
-- @cuidado  Quem já tinha os desafios ligados continua ligado. Sem login (editor SQL do Supabase), o gatilho deixa passar.
-- Seguro rodar de novo.

create or replace function public.ra_trava_desafios_beta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.desafios_beta is distinct from old.desafios_beta
     and auth.uid() is not null
     and not public.ra_sou_super() then
    raise exception 'Apenas o administrador geral pode ligar ou desligar os desafios';
  end if;
  return new;
end $$;

drop trigger if exists ra_trava_desafios_beta on public.ra_familias;
create trigger ra_trava_desafios_beta before update of desafios_beta on public.ra_familias
  for each row execute function public.ra_trava_desafios_beta();
