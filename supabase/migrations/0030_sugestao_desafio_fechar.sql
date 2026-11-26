-- 0030: Pai e Mãe fecham (X) a sugestão de desafio do Painel; ela volta para aquela pessoa em 14 dias.
-- @banco ra_desafio_dispensas (nova): uma linha por pessoa, com a data em que a sugestão pode voltar
-- @rpc ra_desafio_sugestao_dispensar (Pai e Mãe)
-- @decisao 14 dias fixos, guardados no banco para valer em qualquer aparelho de Pai e Mãe.
-- @cuidado Ninguém grava na tabela direto: só pela função. Se a pessoa ganhar um desafio, o cartão some de qualquer jeito.

create table if not exists public.ra_desafio_dispensas (
  membro_id uuid primary key references public.ra_membros(id) on delete cascade,
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  volta_em timestamptz not null
);

alter table public.ra_desafio_dispensas enable row level security;
drop policy if exists ra_ddisp_sel on public.ra_desafio_dispensas;
create policy ra_ddisp_sel on public.ra_desafio_dispensas for select
  using (familia_id = public.ra_minha_familia() and public.ra_sou_gestor());

create or replace function public.ra_desafio_sugestao_dispensar(p_membro uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_sou_gestor() then raise exception 'Só os responsáveis podem fazer isso'; end if;
  if not exists (select 1 from public.ra_membros where id = p_membro and familia_id = public.ra_minha_familia()) then
    raise exception 'Pessoa não encontrada';
  end if;
  insert into public.ra_desafio_dispensas(membro_id, familia_id, volta_em)
  values (p_membro, public.ra_minha_familia(), now() + interval '14 days')
  on conflict (membro_id) do update set volta_em = excluded.volta_em;
end $$;

revoke execute on function public.ra_desafio_sugestao_dispensar(uuid) from public, anon;
grant execute on function public.ra_desafio_sugestao_dispensar(uuid) to authenticated;

notify pgrst, 'reload schema';
