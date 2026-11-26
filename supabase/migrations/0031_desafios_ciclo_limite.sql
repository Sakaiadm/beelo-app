-- @migracao 0031: desafios em ciclos (4 semanas por padrão), limite de 2 por pessoa no banco e 1 troca por semana
-- @altera ra_desafios (colunas novas: ciclo_semanas, ciclo_inicio, ciclo_fim, ciclo_feitas, descansando_em, encerrado_troca)
-- @altera função ra_desafios_atualizar (para de renovar sozinho no fim do ciclo e avisa Pai e Mãe)
-- @altera função ra_desafio_encerrar (no máximo 1 troca por semana por pessoa)
-- @cria função ra_desafio_renovar (Renovar / Subir um nível: começa um ciclo novo)
-- @cria gatilho ra_desafios_limite (máximo de 2 desafios por pessoa e 1 da família, também no banco)
-- @decisao 26/11 Thomas (opção 1): ciclos de 4 semanas, até 2 por pessoa, fim combinado, "descansa" se ninguém responder,
--          nada de renovar sozinho para sempre, trocar no máximo 1 vez por semana por pessoa.
-- @cuidado Seguro rodar de novo (if not exists / create or replace). Não mexe nas migrações antigas.
-- @cuidado Desafio "descansando" continua visível (para mostrar o balanço e os botões), mas NÃO conta no limite de 2.

alter table public.ra_desafios
  add column if not exists ciclo_semanas int not null default 4 check (ciclo_semanas in (2, 4, 8)),
  add column if not exists ciclo_inicio date,
  add column if not exists ciclo_fim date,
  add column if not exists ciclo_feitas int,            -- semanas/meses cumpridos no ciclo, guardado quando ele termina
  add column if not exists descansando_em timestamptz,  -- ciclo terminou e ninguém renovou: não gera mais períodos
  add column if not exists encerrado_troca boolean not null default false; -- encerrado no meio do ciclo (conta como troca)

-- Desafios que já existem ganham um ciclo novo de 4 semanas começando nesta semana (ninguém é pego de surpresa).
update public.ra_desafios
   set ciclo_inicio = public.ra_periodo_inicio('semana', (now() at time zone 'America/Sao_Paulo')::date),
       ciclo_fim = public.ra_periodo_inicio('semana', (now() at time zone 'America/Sao_Paulo')::date) + 7 * ciclo_semanas - 1
 where ativo and ciclo_inicio is null;

-- ===== Limite no banco + datas do ciclo ao criar =====
create or replace function public.ra_desafios_limite() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_hoje date := (now() at time zone 'America/Sao_Paulo')::date; n int;
begin
  if new.ativo then
    select count(*) into n from public.ra_desafios x
     where x.familia_id = new.familia_id and x.ativo and x.descansando_em is null and x.membro_id is not distinct from new.membro_id;
    if new.membro_id is null and n >= 1 then raise exception 'A família já tem um desafio. Termine ou troque o atual para começar outro.'; end if;
    if new.membro_id is not null and n >= 2 then raise exception 'Esta pessoa já tem 2 desafios. Menos é mais: termine ou troque um para começar outro.'; end if;
  end if;
  -- @cuidado o ciclo conta da semana em que o desafio foi criado (criado_em), não de "hoje".
  if new.ciclo_inicio is null then new.ciclo_inicio := public.ra_periodo_inicio('semana', coalesce((new.criado_em at time zone 'America/Sao_Paulo')::date, v_hoje)); end if;
  if new.ciclo_fim is null then new.ciclo_fim := new.ciclo_inicio + 7 * new.ciclo_semanas - 1; end if;
  return new;
end $$;
drop trigger if exists ra_desafios_limite on public.ra_desafios;
create trigger ra_desafios_limite before insert on public.ra_desafios for each row execute function public.ra_desafios_limite();

-- ===== Atualizar: igual ao 0016, mas para no fim do ciclo =====
create or replace function public.ra_desafios_atualizar() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_fam uuid := public.ra_minha_familia(); v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  d public.ra_desafios; v_ini date; v_fim date; v_ult date; c jsonb; per public.ra_desafio_periodos; v_st text; n int := 0;
  v_feitas int; v_nome text;
begin
  if v_fam is null then return 0; end if;
  if not coalesce((select desafios_beta from public.ra_familias where id = v_fam), false) then return 0; end if;
  perform public.ra_gerar_ocorrencias(public.ra_periodo_inicio('semana', v_hoje), public.ra_periodo_inicio('semana', v_hoje) + 6);
  if exists (select 1 from public.ra_desafios where familia_id = v_fam and ativo and periodo = 'mes') then
    perform public.ra_gerar_ocorrencias(public.ra_periodo_inicio('mes', v_hoje), public.ra_periodo_fim('mes', public.ra_periodo_inicio('mes', v_hoje)));
  end if;
  for d in select * from public.ra_desafios where familia_id = v_fam and ativo and descansando_em is null order by criado_em loop
    v_ini := public.ra_periodo_inicio(d.periodo, greatest((d.criado_em at time zone 'America/Sao_Paulo')::date, v_hoje - 63));
    select max(p.inicio) into v_ult from public.ra_desafio_periodos p where p.desafio_id = d.id and p.status <> 'andamento';
    if v_ult is not null and v_ult >= v_ini then v_ini := public.ra_periodo_fim(d.periodo, v_ult) + 1; end if;
    -- @cuidado depois de Renovar, o ciclo novo começa na data dele (não recupera as semanas de descanso).
    if d.ciclo_inicio is not null then v_ini := greatest(v_ini, public.ra_periodo_inicio(d.periodo, d.ciclo_inicio)); end if;
    -- @regra só gera períodos até o fim do ciclo: depois disso o desafio não renova sozinho.
    while v_ini <= v_hoje and (d.ciclo_fim is null or v_ini <= d.ciclo_fim) loop
      v_fim := public.ra_periodo_fim(d.periodo, v_ini);
      c := public.ra_desafio_calc(d, v_ini, v_fim, v_hoje);
      v_st := case when (c->>'cumprido')::boolean then 'cumprido' when v_fim < v_hoje then 'nao_cumprido' else 'andamento' end;
      insert into public.ra_desafio_periodos(desafio_id, familia_id, membro_id, inicio, fim, progresso, meta, possivel, detalhe, status)
      values (d.id, d.familia_id, d.membro_id, v_ini, v_fim, (c->>'progresso')::int, (c->>'meta')::int, (c->>'possivel')::int, c, v_st)
      on conflict (desafio_id, inicio) do update set
        progresso = excluded.progresso, meta = excluded.meta, possivel = excluded.possivel, detalhe = excluded.detalhe,
        status = case when public.ra_desafio_periodos.status = 'cumprido' then 'cumprido' else excluded.status end,
        atualizado_em = now()
      returning * into per;
      if per.status = 'cumprido' and per.cumprido_em is null then
        update public.ra_desafio_periodos set cumprido_em = now() where id = per.id;
        perform public.ra_desafio_premiar(d, per);
        n := n + 1;
      end if;
      v_ini := v_fim + 1;
    end loop;
    -- Fim do ciclo: guarda o balanço, descansa e avisa Pai e Mãe (uma vez só).
    if d.ciclo_fim is not null and v_hoje > d.ciclo_fim
       and not exists (select 1 from public.ra_desafio_periodos p where p.desafio_id = d.id and p.status = 'andamento') then
      select count(*) into v_feitas from public.ra_desafio_periodos p
       where p.desafio_id = d.id and p.status = 'cumprido' and p.inicio >= d.ciclo_inicio and p.inicio <= d.ciclo_fim;
      update public.ra_desafios set descansando_em = now(), ciclo_feitas = v_feitas where id = d.id;
      select nome into v_nome from public.ra_membros where id = d.membro_id;
      perform public.ra_notificar_gestores(d.familia_id,
        case when d.membro_id is null then 'O ciclo do desafio da família terminou: ' || d.titulo
             else 'O ciclo de ' || coalesce(v_nome, 'um desafio') || ' terminou: ' || d.titulo end
        || ' (' || v_feitas || ' de ' || d.ciclo_semanas || ' cumpridas). Renovar, subir um nível ou trocar?', '/desafios');
    end if;
  end loop;
  return n;
end $$;

-- ===== Renovar / subir um nível: começa um ciclo novo =====
-- p_meta (opcional) sobe a meta; p_semanas (opcional) troca a duração (2, 4 ou 8).
create or replace function public.ra_desafio_renovar(p_id uuid, p_semanas int default null, p_meta int default null) returns void
language plpgsql security definer set search_path = public as $$
declare d public.ra_desafios; v_hoje date := (now() at time zone 'America/Sao_Paulo')::date; v_ini date; n int; v_sem int;
begin
  select * into d from public.ra_desafios where id = p_id and familia_id = public.ra_minha_familia() and ativo;
  if not found then raise exception 'Desafio não encontrado'; end if;
  if not (public.ra_sou_gestor() or (d.membro_id = public.ra_meu_id() and d.criado_por = public.ra_meu_id())) then raise exception 'Sem permissão'; end if;
  if d.descansando_em is null and d.ciclo_fim >= v_hoje then raise exception 'Este desafio ainda está no ciclo atual.'; end if;
  v_sem := coalesce(p_semanas, d.ciclo_semanas);
  if v_sem not in (2, 4, 8) then raise exception 'Duração inválida'; end if;
  if p_meta is not null and (p_meta < 1 or p_meta > 100) then raise exception 'Meta inválida'; end if;
  -- Se ele estava descansando e a pessoa já começou outros, o limite vale de novo.
  if d.descansando_em is not null then
    select count(*) into n from public.ra_desafios x
     where x.familia_id = d.familia_id and x.ativo and x.descansando_em is null and x.id <> d.id and x.membro_id is not distinct from d.membro_id;
    if n >= (case when d.membro_id is null then 1 else 2 end) then raise exception 'Já há desafios demais ao mesmo tempo. Troque um deles antes de renovar.'; end if;
  end if;
  v_ini := public.ra_periodo_inicio('semana', v_hoje);
  update public.ra_desafios set ciclo_semanas = v_sem, ciclo_inicio = v_ini, ciclo_fim = v_ini + 7 * v_sem - 1,
         ciclo_feitas = null, descansando_em = null, meta = coalesce(p_meta, meta) where id = p_id;
end $$;

-- ===== Encerrar: no máximo 1 troca por semana por pessoa =====
create or replace function public.ra_desafio_encerrar(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.ra_desafios; v_hoje date := (now() at time zone 'America/Sao_Paulo')::date; v_troca boolean;
begin
  select * into d from public.ra_desafios where id = p_id and familia_id = public.ra_minha_familia() and ativo;
  if not found then raise exception 'Desafio não encontrado'; end if;
  if not (public.ra_sou_gestor() or (d.membro_id = public.ra_meu_id() and d.criado_por = public.ra_meu_id())) then raise exception 'Sem permissão'; end if;
  -- Troca = encerrar no meio do ciclo. Terminar o ciclo, ou desfazer um desafio criado há menos de 1 dia, não conta.
  v_troca := d.descansando_em is null and coalesce(d.ciclo_fim, v_hoje) >= v_hoje and d.criado_em < now() - interval '1 day';
  if v_troca and exists (select 1 from public.ra_desafios x where x.familia_id = d.familia_id and x.id <> d.id and x.encerrado_troca
                          and x.encerrado_em > now() - interval '7 days' and x.membro_id is not distinct from d.membro_id) then
    raise exception 'Já houve uma troca esta semana. Deixe este desafio até o fim do ciclo ou troque na semana que vem.';
  end if;
  update public.ra_desafios set ativo = false, encerrado_em = now(), encerrado_troca = v_troca where id = p_id;
  delete from public.ra_desafio_periodos where desafio_id = p_id and status = 'andamento';
  if d.tarefa_id is not null and not exists (select 1 from public.ra_desafios x where x.tarefa_id = d.tarefa_id and x.ativo) then
    update public.ra_tarefas set ativa = false where id = d.tarefa_id;
    update public.ra_ocorrencias set status = 'cancelada' where tarefa_id = d.tarefa_id and status = 'pendente' and data >= v_hoje;
  end if;
end $$;

revoke execute on function public.ra_desafio_renovar(uuid, int, int) from public, anon;
grant execute on function public.ra_desafio_renovar(uuid, int, int) to authenticated;
revoke execute on function public.ra_desafios_limite() from public, anon, authenticated;

notify pgrst, 'reload schema';
