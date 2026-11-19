-- Rotina Ativa 0007: masculino/feminino da pessoa, para mostrar Filha, Sobrinha, Aluna, Supervisora.
alter table public.ra_membros add column if not exists sexo text;
alter table public.ra_membros drop constraint if exists ra_membros_sexo_check;
alter table public.ra_membros add constraint ra_membros_sexo_check check (sexo is null or sexo in ('m','f'));
