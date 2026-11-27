-- beelo 0034: papéis na tela viram Responsável, Acompanhado(a) e Outro. "Pai" e "Mãe" passam a ser parentesco.
-- No banco nada muda de estrutura (funcao 'pai' = Responsável, 'filho' = Acompanhado(a), 'outro' = Outro).
-- Quem já era Pai ou Mãe ganha o parentesco correspondente (se ainda não tiver um). Pode rodar mais de uma vez.
update public.ra_membros set parentesco = 'pai'
 where funcao = 'pai' and parentesco is null;
update public.ra_membros set parentesco = 'mae'
 where funcao = 'mae' and parentesco is null;
-- 'mae' vira Responsável (funcao 'pai'); o parentesco Mãe já foi guardado acima.
update public.ra_membros set funcao = 'pai' where funcao = 'mae';
