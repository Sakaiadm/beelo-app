-- beelo 0038: "Subir de novo". Guarda a meta e o ganho normais quando a pessoa pega mais leve (0037),
-- para voltar a eles na semana seguinte com 1 toque. Pode rodar mais de uma vez.
alter table public.ra_desafios add column if not exists meta_normal int;      -- meta antes do "pegar mais leve"
alter table public.ra_desafios add column if not exists estrelas_normal int;  -- ganho de estrelinhas antes do "pegar mais leve"
