-- beelo 0024: libera a coluna "parentesco" (criada no 0023) para Pai e Mãe lerem e gravarem.
-- Sem isto, salvar uma pessoa dava "Você não tem permissão para fazer isso" (as colunas de ra_membros têm permissão por coluna).
-- Pode rodar mais de uma vez.
grant select (parentesco) on public.ra_membros to authenticated;
grant insert (parentesco) on public.ra_membros to authenticated;
grant update (parentesco) on public.ra_membros to authenticated;
