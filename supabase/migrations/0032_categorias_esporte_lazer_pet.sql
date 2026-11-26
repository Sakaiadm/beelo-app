-- @migracao 0032: junta Esporte + Lazer em "Esporte e lazer", cria a categoria Pet e renomeia "Música/Cursos" para "Cursos"
-- @altera ra_tarefas (tarefas de Lazer passam para Esporte), ra_desafios.categorias (troca o id de Lazer pelo de Esporte)
-- @altera ra_categorias (renomeia, apaga Lazer, cria Pet), função ra_seed_categorias (famílias novas já nascem assim)
-- @decisao 26/11 Thomas: Esporte e lazer numa só; Pet nova (cor teal); "Cursos" sem música.
-- @cuidado Seguro rodar de novo. Não mexe nas migrações antigas. Rodar na ordem, parte 1, 2, 3.

-- ═══ PARTE 1: juntar Lazer em Esporte ═══
update public.ra_tarefas t set categoria_id = e.id
  from public.ra_categorias l
  join public.ra_categorias e on e.familia_id = l.familia_id and lower(e.nome) in ('esporte', 'esporte e lazer')
 where lower(l.nome) = 'lazer' and t.categoria_id = l.id;

update public.ra_desafios d set categorias = (
    select coalesce(array_agg(distinct coalesce(m.id, c)), '{}')
      from unnest(d.categorias) as c
      left join (select l.id as lid, e.id from public.ra_categorias l
                   join public.ra_categorias e on e.familia_id = l.familia_id and lower(e.nome) in ('esporte', 'esporte e lazer')
                  where lower(l.nome) = 'lazer') m on m.lid = c)
 where exists (select 1 from public.ra_categorias l where lower(l.nome) = 'lazer' and l.id = any(d.categorias));

delete from public.ra_categorias l where lower(l.nome) = 'lazer'
   and exists (select 1 from public.ra_categorias e where e.familia_id = l.familia_id and lower(e.nome) in ('esporte', 'esporte e lazer'));
update public.ra_categorias set nome = 'Esporte e lazer' where lower(nome) = 'esporte';
update public.ra_categorias set nome = 'Esporte e lazer' where lower(nome) = 'lazer';  -- família que só tinha Lazer

-- ═══ PARTE 2: Cursos e Pet ═══
update public.ra_categorias c set nome = 'Cursos'
 where c.nome = 'Música/Cursos'
   and not exists (select 1 from public.ra_categorias x where x.familia_id = c.familia_id and lower(x.nome) = 'cursos');

insert into public.ra_categorias(familia_id, nome, cor, ordem)
select f.id, 'Pet', 'teal', 5 from public.ra_familias f
 where not exists (select 1 from public.ra_categorias x where x.familia_id = f.id and lower(x.nome) = 'pet');

-- ═══ PARTE 3: famílias novas já nascem com as categorias certas ═══
create or replace function public.ra_seed_categorias(p_fam uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.ra_categorias(familia_id, nome, cor, ordem)
  select p_fam, c.nome, c.cor, c.ordem
    from (values ('Casa','laranja',1),('Estudo','indigo',2),('Esporte e lazer','verde',3),('Pet','teal',4),('Social','rosa',5),
                 ('Saúde','vermelho',6),('Cuidado pessoal','ciano',7),('Espiritual','amarelo',8),('Financeiro','oliva',9),
                 ('Trabalho','marrom',10),('Outros','cinza',99)) as c(nome, cor, ordem)
   where not exists (select 1 from public.ra_categorias x where x.familia_id = p_fam and lower(x.nome) = lower(c.nome))
$$;
