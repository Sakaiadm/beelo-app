-- beelo 0016: Desafios e prêmios (versão beta). Pode rodar mais de uma vez.
-- Começa DESLIGADO em todas as famílias: Pai ou Mãe liga em Desafios.
-- Semana de segunda a domingo. O fechamento da semana acontece sozinho quando alguém da família abre o app.

-- ============ Ajustes da família e das pessoas ============
alter table public.ra_familias add column if not exists desafios_beta boolean not null default false;
alter table public.ra_familias add column if not exists mural_visivel text not null default 'todos';
alter table public.ra_familias drop constraint if exists ra_familias_mural_chk;
alter table public.ra_familias add constraint ra_familias_mural_chk check (mural_visivel in ('todos', 'pais'));
alter table public.ra_membros add column if not exists premios_ate8 boolean not null default false;
alter table public.ra_membros add column if not exists cofrinho_meta uuid;

-- ============ Tabelas ============
create table if not exists public.ra_desafios (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid references public.ra_membros(id) on delete cascade, -- vazio = desafio da família toda
  grupo uuid,                                                          -- mesmo desafio criado para várias pessoas
  catalogo text,
  titulo text not null check (char_length(titulo) between 1 and 80),
  descricao text check (char_length(descricao) <= 300),
  icone text,
  tipo text not null check (tipo in ('dias','seq','pct','pct_cada','melhor','capricho','tela_ok','variedade','proprias')),
  alvo text not null default 'todas' check (alvo in ('todas','categoria','tarefa','horario','manha','noite','combo')),
  categorias uuid[] not null default '{}',
  tarefa_id uuid references public.ra_tarefas(id) on delete set null,
  criterio text not null default 'feita' check (criterio in ('feita','no_dia','no_horario')),
  dias_semana int[],
  meta int not null check (meta between 0 and 100),
  periodo text not null default 'semana' check (periodo in ('semana','mes')),
  coringa boolean not null default true,
  recompensa text not null default 'nenhuma' check (recompensa in ('estrelas','semanas','premio','nenhuma')),
  estrelas int not null default 10 check (estrelas between 0 and 100),
  premio text check (char_length(premio) <= 80),
  ativo boolean not null default true,
  criado_por uuid not null references public.ra_membros(id),
  criado_em timestamptz not null default now(),
  encerrado_em timestamptz
);
create index if not exists ra_desafios_familia on public.ra_desafios(familia_id, ativo);

create table if not exists public.ra_desafio_periodos (
  id uuid primary key default gen_random_uuid(),
  desafio_id uuid not null references public.ra_desafios(id) on delete cascade,
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid references public.ra_membros(id) on delete cascade,
  inicio date not null,
  fim date not null,
  progresso int not null default 0,
  meta int not null default 0,
  possivel int not null default 0,
  detalhe jsonb not null default '{}',
  status text not null default 'andamento' check (status in ('andamento','cumprido','nao_cumprido')),
  cumprido_em timestamptz,
  visto boolean not null default false,
  atualizado_em timestamptz not null default now(),
  unique (desafio_id, inicio)
);
create index if not exists ra_desper_familia on public.ra_desafio_periodos(familia_id, status);

create table if not exists public.ra_premios (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  catalogo text,
  nome text not null check (char_length(nome) between 1 and 80),
  custo int not null check (custo between 1 and 1000),
  moeda text not null default 'estrelas' check (moeda in ('estrelas','semanas')),
  faixa text not null default 'todos' check (faixa in ('ate8','mais8','todos','teen')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create unique index if not exists ra_premios_cat on public.ra_premios(familia_id, catalogo) where catalogo is not null;

create table if not exists public.ra_premio_pedidos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid references public.ra_membros(id) on delete cascade, -- vazio = prêmio da família
  premio_id uuid references public.ra_premios(id) on delete set null,
  periodo_id uuid references public.ra_desafio_periodos(id) on delete set null,
  nome text not null,
  custo int not null default 0,
  moeda text not null default 'estrelas' check (moeda in ('estrelas','semanas')),
  status text not null default 'pedido' check (status in ('pedido','entregue','cancelado')),
  criado_em timestamptz not null default now(),
  entregue_em timestamptz,
  entregue_por uuid references public.ra_membros(id)
);
create index if not exists ra_pedidos_familia on public.ra_premio_pedidos(familia_id, status);

-- Cofrinho: cada entrada (+) e troca (−). Estrelinhas (criança) e semanas conquistadas (adolescente) nunca vencem.
create table if not exists public.ra_cofrinho (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid not null references public.ra_membros(id) on delete cascade,
  moeda text not null check (moeda in ('estrelas','semanas')),
  valor int not null,
  motivo text,
  periodo_id uuid references public.ra_desafio_periodos(id) on delete set null,
  pedido_id uuid references public.ra_premio_pedidos(id) on delete set null,
  semana date,
  criado_em timestamptz not null default now()
);
create index if not exists ra_cofrinho_membro on public.ra_cofrinho(membro_id, moeda);
create unique index if not exists ra_cofrinho_periodo on public.ra_cofrinho(periodo_id) where periodo_id is not null and valor > 0;
create unique index if not exists ra_cofrinho_semana on public.ra_cofrinho(membro_id, semana) where moeda = 'semanas' and valor > 0;

-- ============ Regras de acesso ============
create or replace function public.ra_mural_todos() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select mural_visivel = 'todos' from public.ra_familias where id = public.ra_minha_familia()), false)
$$;

alter table public.ra_desafios enable row level security;
alter table public.ra_desafio_periodos enable row level security;
alter table public.ra_premios enable row level security;
alter table public.ra_premio_pedidos enable row level security;
alter table public.ra_cofrinho enable row level security;

drop policy if exists ra_des_sel on public.ra_desafios;
create policy ra_des_sel on public.ra_desafios for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id is null or membro_id = public.ra_meu_id() or public.ra_mural_todos()));
drop policy if exists ra_des_ins on public.ra_desafios;
create policy ra_des_ins on public.ra_desafios for insert with check (
  familia_id = public.ra_minha_familia() and criado_por = public.ra_meu_id()
  and (public.ra_sou_gestor() or (membro_id = public.ra_meu_id() and not coalesce((select modo_crianca from public.ra_membros where id = public.ra_meu_id()), false))));
drop policy if exists ra_des_upd on public.ra_desafios;
create policy ra_des_upd on public.ra_desafios for update using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or (membro_id = public.ra_meu_id() and criado_por = public.ra_meu_id())))
  with check (familia_id = public.ra_minha_familia());

drop policy if exists ra_desper_sel on public.ra_desafio_periodos;
create policy ra_desper_sel on public.ra_desafio_periodos for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id is null or membro_id = public.ra_meu_id() or public.ra_mural_todos()));

drop policy if exists ra_pre_sel on public.ra_premios;
create policy ra_pre_sel on public.ra_premios for select using (familia_id = public.ra_minha_familia());
drop policy if exists ra_pre_all on public.ra_premios;
create policy ra_pre_all on public.ra_premios for all using (familia_id = public.ra_minha_familia() and public.ra_sou_gestor())
  with check (familia_id = public.ra_minha_familia() and public.ra_sou_gestor());

drop policy if exists ra_ped_sel on public.ra_premio_pedidos;
create policy ra_ped_sel on public.ra_premio_pedidos for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id is null or membro_id = public.ra_meu_id() or public.ra_mural_todos()));

drop policy if exists ra_cof_sel on public.ra_cofrinho;
create policy ra_cof_sel on public.ra_cofrinho for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id = public.ra_meu_id()));

-- ============ Medição ============
create or replace function public.ra_periodo_inicio(p_periodo text, p_dia date) returns date
language sql immutable as $$
  select case when p_periodo = 'mes' then date_trunc('month', p_dia)::date
              else p_dia - ((extract(dow from p_dia)::int + 6) % 7) end
$$;
create or replace function public.ra_periodo_fim(p_periodo text, p_inicio date) returns date
language sql immutable as $$
  select case when p_periodo = 'mes' then (date_trunc('month', p_inicio) + interval '1 month - 1 day')::date
              else p_inicio + 6 end
$$;

-- Ocorrências que contam para o desafio no período, já dizendo se cada uma conta como feita.
create or replace function public.ra_desafio_base(d public.ra_desafios, p_ini date, p_fim date)
returns table(data date, membro_id uuid, categoria_id uuid, criada_por uuid, ok boolean)
language sql stable security definer set search_path = public as $$
  select o.data, o.membro_id, t.categoria_id, t.criada_por,
         (o.justificativa_status = 'aceita' or (o.status = 'cumprida' and (
            d.criterio = 'feita'
            or (d.criterio = 'no_dia' and (o.concluida_em at time zone 'America/Sao_Paulo')::date <= o.data)
            or (d.criterio = 'no_horario' and o.concluida_em <=
                ((o.data + coalesce(o.hora_fim, o.hora_inicio, time '23:59')) at time zone 'America/Sao_Paulo') + interval '59 seconds')))) as ok
    from public.ra_ocorrencias o join public.ra_tarefas t on t.id = o.tarefa_id
   where o.familia_id = d.familia_id and o.data between p_ini and p_fim
     and o.status not in ('adiada', 'cancelada')
     and (case when d.membro_id is null
               then o.membro_id in (select m.id from public.ra_membros m where m.familia_id = d.familia_id and m.ativo)
               else o.membro_id = d.membro_id end)
     and (d.dias_semana is null or extract(dow from o.data)::int = any(d.dias_semana))
     and (case d.alvo
            when 'categoria' then (t.categoria_id = any(d.categorias) or t.id = d.tarefa_id)
            when 'combo' then t.categoria_id = any(d.categorias)
            when 'tarefa' then t.id = d.tarefa_id
            when 'horario' then o.hora_inicio is not null
            when 'manha' then o.hora_inicio < time '12:00'
            when 'noite' then o.hora_inicio >= time '18:00'
            else true end)
$$;

-- Calcula um desafio num período: progresso, meta (já com o dia coringa), se cumpriu e como foi cada dia.
-- Cada dia: ok (tudo feito) · falta · cor (dia coringa) · hoje · futuro · livre (sem tarefa que conte).
create or replace function public.ra_desafio_calc(d public.ra_desafios, p_ini date, p_fim date, p_hoje date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r record; ncat int := greatest(coalesce(array_length(d.categorias, 1), 0), 1);
  v_dias jsonb := '[]'; v_st text; v_pos int := 0; v_ok int := 0; v_tot int := 0; v_fei int := 0;
  v_cor boolean; v_cor_dia date; v_pior int := 0; v_pior_dia date; v_pior_n int := 0; v_pior_f int := 0; v_prim_falta date;
  v_prog int := 0; v_req int := 1; v_cump boolean := false; v_run int := 0; v_best int := 0; v_ponte boolean := false;
  v_prev int; v_x int; e jsonb; dd date; v_prev_tot int; v_real int; v_pr int;
begin
  if d.tipo = 'tela_ok' then
    dd := p_ini;
    while dd <= p_fim loop
      select pd.min_total into v_pr from public.ra_tela_previsto_dia(d.membro_id, dd) pd limit 1;
      select coalesce(tr.min_total, coalesce(tr.min_celular, 0) + coalesce(tr.min_computador, 0)) into v_real
        from public.ra_tela_real tr where tr.membro_id = d.membro_id and tr.data = dd;
      if v_pr is null then v_st := 'livre';
      elsif v_real is not null and v_real <= v_pr then v_st := 'ok';
      elsif dd >= p_hoje then v_st := case when dd = p_hoje then 'hoje' else 'futuro' end;
      else v_st := 'falta'; end if;
      if v_pr is not null then v_pos := v_pos + 1; end if;
      if v_st = 'ok' then v_ok := v_ok + 1; end if;
      v_dias := v_dias || jsonb_build_object('d', dd, 's', v_st);
      v_pr := null; v_real := null; dd := dd + 1;
    end loop;
    v_req := least(d.meta, greatest(v_pos, 1));
    return jsonb_build_object('progresso', v_ok, 'meta', v_req, 'possivel', v_pos, 'cumprido', v_pos > 0 and v_ok >= v_req, 'dias', v_dias);
  end if;

  for r in
    with b as (select * from public.ra_desafio_base(d, p_ini, p_fim))
    select g::date as dia,
           case when d.alvo = 'combo'
                then case when (select count(distinct b.categoria_id) from b where b.data = g::date) >= ncat then 1 else 0 end
                else (select count(*) from b where b.data = g::date)::int end as n,
           case when d.alvo = 'combo'
                then case when (select count(distinct b.categoria_id) from b where b.data = g::date and b.ok) >= ncat then 1 else 0 end
                else (select count(*) from b where b.data = g::date and b.ok)::int end as f
      from generate_series(p_ini, p_fim, interval '1 day') g
     order by 1
  loop
    if r.n = 0 then v_st := 'livre';
    elsif r.dia > p_hoje then v_st := 'futuro';
    elsif r.f >= r.n then v_st := 'ok';
    elsif r.dia = p_hoje then v_st := 'hoje';
    else v_st := 'falta'; end if;
    if r.n > 0 then v_pos := v_pos + 1; end if;
    if v_st = 'ok' then v_ok := v_ok + 1; end if;
    v_tot := v_tot + r.n; v_fei := v_fei + least(r.f, r.n);
    if v_st = 'falta' then
      if v_prim_falta is null then v_prim_falta := r.dia; end if;
      if r.n - r.f > v_pior then v_pior := r.n - r.f; v_pior_dia := r.dia; v_pior_n := r.n; v_pior_f := r.f; end if;
    end if;
    v_dias := v_dias || jsonb_build_object('d', r.dia, 's', v_st, 'n', r.n, 'f', r.f);
  end loop;

  -- Dia coringa: só em semanas (ou meses) com pelo menos 5 dias que contam; um dia difícil não conta.
  v_cor := d.coringa and v_pos >= 5 and d.tipo in ('dias', 'seq', 'pct');
  if v_cor then v_cor_dia := case when d.tipo = 'pct' then v_pior_dia else v_prim_falta end; end if;

  if d.tipo = 'dias' then
    v_req := case when d.meta >= v_pos then greatest(v_pos - case when v_cor then 1 else 0 end, 1) else greatest(d.meta, 1) end;
    v_prog := v_ok; v_cump := v_pos > 0 and v_ok >= v_req;
  elsif d.tipo = 'seq' then
    for e in select * from jsonb_array_elements(v_dias) loop
      if e->>'s' = 'ok' then v_run := v_run + 1; v_best := greatest(v_best, v_run);
      elsif e->>'s' = 'falta' then
        if v_cor and not v_ponte then v_ponte := true; else v_run := 0; end if;
      end if;
    end loop;
    v_req := least(greatest(d.meta, 1), greatest(v_pos - case when v_cor then 1 else 0 end, 1));
    v_prog := v_best; v_cump := v_pos > 0 and v_best >= v_req;
  elsif d.tipo = 'pct' then
    if v_cor_dia is not null then v_tot := v_tot - v_pior_n; v_fei := v_fei - v_pior_f; end if;
    v_req := d.meta;
    v_prog := case when v_tot > 0 then (v_fei * 100) / v_tot else 0 end;
    v_cump := v_tot > 0 and v_fei * 100 >= d.meta * v_tot;
  elsif d.tipo = 'pct_cada' then
    select min((x.f * 100) / x.n), count(*), bool_and(x.f * 100 >= d.meta * x.n) into v_prog, v_x, v_cump
      from (select b.membro_id, count(*)::int n, count(*) filter (where b.ok)::int f
              from public.ra_desafio_base(d, p_ini, p_fim) b group by b.membro_id) x;
    v_prog := coalesce(v_prog, 0); v_req := d.meta; v_cump := coalesce(v_cump, false) and v_x > 0;
  elsif d.tipo = 'melhor' then
    select count(*) filter (where b.ok) into v_prev from public.ra_desafio_base(d, p_ini - (p_fim - p_ini + 1), p_ini - 1) b;
    v_prog := v_fei; v_req := coalesce(v_prev, 0) + 1; v_cump := v_prog >= v_req;
  elsif d.tipo = 'capricho' then
    select count(*) into v_x from public.ra_historico h join public.ra_ocorrencias o on o.id::text = h.detalhe->>'ocorrencia'
     where h.familia_id = d.familia_id and h.acao = 'conferir' and h.detalhe->>'valor' = 'refazer'
       and o.membro_id = d.membro_id and (h.criado_em at time zone 'America/Sao_Paulo')::date between p_ini and p_fim;
    v_prog := v_x; v_req := 0; v_cump := p_fim < p_hoje and v_x = 0 and v_fei > 0;
  elsif d.tipo = 'variedade' then
    select count(distinct b.categoria_id) into v_prog from public.ra_desafio_base(d, p_ini, p_fim) b where b.ok and b.categoria_id is not null;
    v_req := d.meta; v_cump := v_prog >= v_req;
  elsif d.tipo = 'proprias' then
    select count(*) into v_prog from public.ra_desafio_base(d, p_ini, p_fim) b where b.ok and b.criada_por = d.membro_id;
    v_req := d.meta; v_cump := v_prog >= v_req;
  end if;

  if v_cor_dia is not null then
    select jsonb_agg(case when (x->>'d')::date = v_cor_dia then x || '{"s":"cor"}' else x end) into v_dias from jsonb_array_elements(v_dias) x;
  end if;
  return jsonb_build_object('progresso', v_prog, 'meta', v_req, 'possivel', v_pos, 'cumprido', coalesce(v_cump, false),
    'feitas', v_fei, 'total', v_tot, 'coringa', v_cor_dia, 'dias', v_dias);
end $$;

-- Cumpriu: estrelinhas no cofrinho (criança), semana conquistada (adolescente) ou prêmio para entregar (família), e avisos.
create or replace function public.ra_desafio_premiar(d public.ra_desafios, per public.ra_desafio_periodos) returns void
language plpgsql security definer set search_path = public as $$
declare v_nome text; v_txt text := '';
begin
  if d.membro_id is not null then select nome into v_nome from public.ra_membros where id = d.membro_id; end if;
  if d.recompensa = 'estrelas' and d.membro_id is not null and d.estrelas > 0 then
    if not exists (select 1 from public.ra_cofrinho where periodo_id = per.id and valor > 0) then
      insert into public.ra_cofrinho(familia_id, membro_id, moeda, valor, motivo, periodo_id)
      values (d.familia_id, d.membro_id, 'estrelas', d.estrelas, d.titulo, per.id);
    end if;
    v_txt := ' +' || d.estrelas || ' estrelinhas no cofrinho!';
  elsif d.recompensa = 'semanas' and d.membro_id is not null then
    if not exists (select 1 from public.ra_cofrinho where membro_id = d.membro_id and moeda = 'semanas' and valor > 0
                    and semana = public.ra_periodo_inicio('semana', per.inicio)) then
      insert into public.ra_cofrinho(familia_id, membro_id, moeda, valor, motivo, periodo_id, semana)
      values (d.familia_id, d.membro_id, 'semanas', 1, d.titulo, per.id, public.ra_periodo_inicio('semana', per.inicio));
      v_txt := ' Mais uma semana conquistada!';
    end if;
  end if;
  if coalesce(d.premio, '') <> '' and not exists (select 1 from public.ra_premio_pedidos where periodo_id = per.id) then
    insert into public.ra_premio_pedidos(familia_id, membro_id, periodo_id, nome, custo, status)
    values (d.familia_id, d.membro_id, per.id, d.premio, 0, 'pedido');
  end if;
  if d.membro_id is null then
    insert into public.ra_notificacoes(familia_id, para_membro, titulo, link)
    select d.familia_id, m.id, 'A família cumpriu o desafio: ' || d.titulo || coalesce(' Prêmio: ' || d.premio, ''), '/desafios'
      from public.ra_membros m where m.familia_id = d.familia_id and m.ativo;
  else
    perform public.ra_notificar(d.familia_id, d.membro_id, 'Desafio cumprido: ' || d.titulo || '.' || v_txt, '/desafios');
    insert into public.ra_notificacoes(familia_id, para_membro, titulo, link)
    select d.familia_id, m.id, v_nome || ' cumpriu o desafio: ' || d.titulo, '/desafios'
      from public.ra_membros m where m.familia_id = d.familia_id and m.ativo and m.papel = 'gestor' and m.id <> d.membro_id;
  end if;
end $$;

-- Atualiza os desafios da família de quem abriu o app: semana atual e as que ainda não foram fechadas.
-- Devolve quantos desafios foram cumpridos agora.
create or replace function public.ra_desafios_atualizar() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_fam uuid := public.ra_minha_familia(); v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  d public.ra_desafios; v_ini date; v_fim date; v_ult date; c jsonb; per public.ra_desafio_periodos; v_st text; n int := 0;
begin
  if v_fam is null then return 0; end if;
  if not coalesce((select desafios_beta from public.ra_familias where id = v_fam), false) then return 0; end if;
  -- Gera as tarefas da semana e do mês atuais (para saber quantos dias ainda vêm pela frente).
  perform public.ra_gerar_ocorrencias(public.ra_periodo_inicio('semana', v_hoje), public.ra_periodo_inicio('semana', v_hoje) + 6);
  if exists (select 1 from public.ra_desafios where familia_id = v_fam and ativo and periodo = 'mes') then
    perform public.ra_gerar_ocorrencias(public.ra_periodo_inicio('mes', v_hoje), public.ra_periodo_fim('mes', public.ra_periodo_inicio('mes', v_hoje)));
  end if;
  for d in select * from public.ra_desafios where familia_id = v_fam and ativo order by criado_em loop
    v_ini := public.ra_periodo_inicio(d.periodo, greatest((d.criado_em at time zone 'America/Sao_Paulo')::date, v_hoje - 63));
    select max(p.inicio) into v_ult from public.ra_desafio_periodos p where p.desafio_id = d.id and p.status <> 'andamento';
    if v_ult is not null and v_ult >= v_ini then v_ini := public.ra_periodo_fim(d.periodo, v_ult) + 1; end if;
    while v_ini <= v_hoje loop
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
  end loop;
  return n;
end $$;

-- A pessoa viu a comemoração do desafio cumprido (não mostra de novo).
create or replace function public.ra_desafio_visto(p_periodo uuid) returns void
language sql security definer set search_path = public as $$
  update public.ra_desafio_periodos set visto = true where id = p_periodo and membro_id = public.ra_meu_id()
$$;

-- Encerrar um desafio (Pai, Mãe ou quem criou o próprio). A tarefa criada junto com ele para de aparecer.
create or replace function public.ra_desafio_encerrar(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.ra_desafios; v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select * into d from public.ra_desafios where id = p_id and familia_id = public.ra_minha_familia() and ativo;
  if not found then raise exception 'Desafio não encontrado'; end if;
  if not (public.ra_sou_gestor() or (d.membro_id = public.ra_meu_id() and d.criado_por = public.ra_meu_id())) then raise exception 'Sem permissão'; end if;
  update public.ra_desafios set ativo = false, encerrado_em = now() where id = p_id;
  delete from public.ra_desafio_periodos where desafio_id = p_id and status = 'andamento';
  if d.tarefa_id is not null and not exists (select 1 from public.ra_desafios x where x.tarefa_id = d.tarefa_id and x.ativo) then
    update public.ra_tarefas set ativa = false where id = d.tarefa_id;
    update public.ra_ocorrencias set status = 'cancelada' where tarefa_id = d.tarefa_id and status = 'pendente' and data >= v_hoje;
  end if;
end $$;

-- Trocar estrelinhas (ou semanas) por um prêmio da vitrine. A criança pede; Pai ou Mãe também podem pedir por ela.
create or replace function public.ra_premio_pedir(p_premio uuid, p_membro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); m public.ra_membros; pr public.ra_premios; v_saldo int; v_ped uuid;
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  select * into m from public.ra_membros where id = coalesce(p_membro, me.id) and familia_id = me.familia_id and ativo;
  if not found then raise exception 'Pessoa não encontrada'; end if;
  if m.id <> me.id and me.papel <> 'gestor' then raise exception 'Sem permissão'; end if;
  select * into pr from public.ra_premios where id = p_premio and familia_id = me.familia_id and ativo;
  if not found then raise exception 'Prêmio não encontrado'; end if;
  perform pg_advisory_xact_lock(hashtext('cofrinho' || m.id::text));
  select coalesce(sum(valor), 0) into v_saldo from public.ra_cofrinho where membro_id = m.id and moeda = pr.moeda;
  if v_saldo < pr.custo then
    raise exception 'Ainda faltam % %', pr.custo - v_saldo, case when pr.moeda = 'semanas' then 'semanas' else 'estrelinhas' end;
  end if;
  insert into public.ra_premio_pedidos(familia_id, membro_id, premio_id, nome, custo, moeda)
  values (m.familia_id, m.id, pr.id, pr.nome, pr.custo, pr.moeda) returning id into v_ped;
  insert into public.ra_cofrinho(familia_id, membro_id, moeda, valor, motivo, pedido_id)
  values (m.familia_id, m.id, pr.moeda, -pr.custo, 'Troca: ' || pr.nome, v_ped);
  if m.cofrinho_meta = pr.id then update public.ra_membros set cofrinho_meta = null where id = m.id; end if;
  perform public.ra_notificar_gestores(m.familia_id, m.nome || ' trocou ' || pr.custo || case when pr.moeda = 'semanas' then ' semanas' else ' estrelinhas' end
    || ' por: ' || pr.nome, '/desafios');
end $$;

-- Pai ou Mãe marcam "entregue" (ou desfazem a troca: as estrelinhas voltam para o cofrinho).
create or replace function public.ra_premio_entregar(p_pedido uuid, p_entregue boolean) returns void
language plpgsql security definer set search_path = public as $$
declare pe public.ra_premio_pedidos;
begin
  if not public.ra_sou_gestor() then raise exception 'Só os responsáveis podem fazer isso'; end if;
  update public.ra_premio_pedidos set status = case when p_entregue then 'entregue' else 'cancelado' end,
         entregue_em = case when p_entregue then now() end, entregue_por = public.ra_meu_id()
   where id = p_pedido and familia_id = public.ra_minha_familia() and status = 'pedido' returning * into pe;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if not p_entregue and pe.custo > 0 and pe.membro_id is not null then
    insert into public.ra_cofrinho(familia_id, membro_id, moeda, valor, motivo, pedido_id)
    values (pe.familia_id, pe.membro_id, pe.moeda, pe.custo, 'Troca desfeita: ' || pe.nome, pe.id);
  end if;
  if pe.membro_id is not null then
    perform public.ra_notificar(pe.familia_id, pe.membro_id,
      case when p_entregue then 'Prêmio entregue: ' || pe.nome || '. Aproveite!' else 'A troca por ' || pe.nome || ' foi desfeita. O que você juntou voltou para o cofrinho.' end, '/desafios/cofrinho');
  end if;
end $$;

-- Prêmio que a pessoa está juntando para ganhar (vazio = o app sugere sozinho).
create or replace function public.ra_cofrinho_meta(p_premio uuid, p_membro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); v_alvo uuid := coalesce(p_membro, me.id);
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if v_alvo <> me.id and me.papel <> 'gestor' then raise exception 'Sem permissão'; end if;
  if p_premio is not null and not exists (select 1 from public.ra_premios where id = p_premio and familia_id = me.familia_id) then raise exception 'Prêmio não encontrado'; end if;
  update public.ra_membros set cofrinho_meta = p_premio where id = v_alvo and familia_id = me.familia_id;
end $$;

-- Funções: só usuários logados; as internas, ninguém de fora.
revoke execute on function public.ra_desafios_atualizar(), public.ra_desafio_visto(uuid), public.ra_desafio_encerrar(uuid),
  public.ra_premio_pedir(uuid, uuid), public.ra_premio_entregar(uuid, boolean), public.ra_cofrinho_meta(uuid, uuid), public.ra_mural_todos() from public, anon;
grant execute on function public.ra_desafios_atualizar(), public.ra_desafio_visto(uuid), public.ra_desafio_encerrar(uuid),
  public.ra_premio_pedir(uuid, uuid), public.ra_premio_entregar(uuid, boolean), public.ra_cofrinho_meta(uuid, uuid), public.ra_mural_todos() to authenticated;
revoke execute on function public.ra_desafio_base(public.ra_desafios, date, date), public.ra_desafio_calc(public.ra_desafios, date, date, date),
  public.ra_desafio_premiar(public.ra_desafios, public.ra_desafio_periodos) from public, anon, authenticated;

notify pgrst, 'reload schema';
