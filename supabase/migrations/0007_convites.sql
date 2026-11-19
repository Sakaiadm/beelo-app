-- Rotina Ativa 0007: guarda quando o convite por e-mail foi enviado. Pode rodar mais de uma vez.
alter table public.ra_membros add column if not exists convidado_em timestamptz;
