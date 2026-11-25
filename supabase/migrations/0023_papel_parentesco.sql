-- beelo 0023: separa PAPEL (o que a pessoa pode fazer: pai, mae, filho, outro = Adulto que ajuda)
-- de PARENTESCO (rótulo opcional exibido no perfil; não muda permissões).
-- Sai Aluno, Supervisor e Sobrinho como papéis. Pode rodar mais de uma vez.

alter table public.ra_membros add column if not exists parentesco text;
alter table public.ra_membros drop constraint if exists ra_membros_parentesco_check;
alter table public.ra_membros add constraint ra_membros_parentesco_check
  check (parentesco is null or parentesco in ('pai','mae','padrasto','madrasta','filho','enteado','irmao','irma',
    'avo','avoa','tio','tia','sobrinho','neto','padrinho','madrinha','afilhado','cuidador','outro'));

-- quem era Sobrinho vira Filho(a) com parentesco sobrinho; quem era Aluno vira Filho(a)
update public.ra_membros set parentesco = 'sobrinho' where funcao = 'sobrinho' and parentesco is null;
update public.ra_membros set funcao = 'filho' where funcao in ('sobrinho', 'aluno');

-- quem era Supervisor vira Adulto que ajuda, mantendo as 3 chaves (as já guardadas valem)
update public.ra_membros
   set permissoes = jsonb_build_object('ver_painel', true, 'conferir', true, 'ver_relatorios', true) || coalesce(permissoes, '{}'::jsonb),
       funcao = 'outro'
 where funcao = 'supervisor';

alter table public.ra_membros drop constraint if exists ra_membros_funcao_check;
alter table public.ra_membros add constraint ra_membros_funcao_check
  check (funcao is null or funcao in ('pai','mae','filho','outro'));
