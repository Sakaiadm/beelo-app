-- Trilha de testes dos Desafios (SQL 0016). Roda numa transação e termina com RAISE EXCEPTION com o relatório:
-- nada fica gravado. Uso: depois de bash testes/banco-local.sh, rode
--   psql -h /var/tmp/pgra -p 5499 -U postgres -d ra -f supabase/testes/trilha_desafios.sql
do $$
declare
  r text := ''; nok int := 0; nfalha int := 0;
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  seg date := hoje - ((extract(dow from hoje)::int + 6) % 7);   -- segunda desta semana
  segp date := seg - 7;                                           -- segunda da semana passada
  gU uuid := gen_random_uuid(); cU uuid := gen_random_uuid(); tU uuid := gen_random_uuid();
  fam uuid; G uuid; C uuid; T uuid; cat uuid; tC uuid; tT uuid; dC uuid; dT uuid; dF uuid; dS uuid; pr uuid; pr2 uuid; ped uuid;
  n int; v int; s text; b boolean; cj jsonb; d public.ra_desafios;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
    (gU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'des-pai@teste.local', '{}', '{}', now(), now()),
    (cU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'des-cri@teste.local', '{}', '{}', now(), now()),
    (tU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'des-ado@teste.local', '{}', '{}', now(), now());
  insert into public.ra_familias(nome) values ('DESAFIOS') returning id into fam;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id) values (fam, 'des-pai@teste.local', 'Pai', 'gestor', gU) returning id into G;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id, modo_crianca, funcao) values (fam, 'des-cri@teste.local', 'Lucas', 'filho', cU, true, 'filho') returning id into C;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id, funcao) values (fam, 'des-ado@teste.local', 'Julia', 'filho', tU, 'filho') returning id into T;
  insert into public.ra_categorias(familia_id, nome, cor) values (fam, 'Estudo', 'indigo') returning id into cat;
  -- Tarefa diária de Estudo para o Lucas e para a Júlia desde 3 semanas atrás.
  insert into public.ra_tarefas(familia_id, titulo, categoria_id, responsavel_id, tipo, recorrencia, data_inicio, criada_por)
  values (fam, 'Estudar', cat, C, 'recorrente', 'diaria', segp - 14, G) returning id into tC;
  insert into public.ra_tarefas(familia_id, titulo, categoria_id, responsavel_id, tipo, recorrencia, data_inicio, criada_por)
  values (fam, 'Ler', cat, T, 'recorrente', 'diaria', segp - 14, G) returning id into tT;

  -- ===== Pai liga os desafios =====
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'des-pai@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform public.ra_gerar_ocorrencias(segp, seg + 6);
  select public.ra_desafios_atualizar() into n;
  if n = 0 then nok := nok + 1; r := r || E'OK  D1 Com o beta desligado, nada é calculado\n'; else nfalha := nfalha + 1; r := r || E'FALHA D1\n'; end if;
  begin update public.ra_familias set desafios_beta = true where id = fam; nfalha := nfalha + 1; r := r || E'FALHA D1b Pai comum ligou os desafios\n';
  exception when others then nok := nok + 1; r := r || E'OK  D1b Pai comum não liga os desafios (só o administrador geral)\n'; end;
  -- @cuidado: desde a 0025 só o administrador geral liga; o teste liga como dono do banco.
  execute 'reset role'; perform set_config('request.jwt.claims', '', true); update public.ra_familias set desafios_beta = true where id = fam;
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'des-pai@teste.local', 'role', 'authenticated')::text, true); execute 'set local role authenticated';
  insert into public.ra_premios(familia_id, catalogo, nome, custo, moeda, faixa) values (fam, 's1', 'Escolher a sobremesa', 10, 'estrelas', 'todos') returning id into pr;
  insert into public.ra_premios(familia_id, catalogo, nome, custo, moeda, faixa) values (fam, 'v4', 'Cinema', 60, 'estrelas', 'todos') returning id into pr2;
  nok := nok + 1; r := r || E'OK  D2 Pai liga o beta e monta a vitrine\n';

  -- Semana passada: Lucas fez Estudo em 6 dias (falhou na quarta). Júlia fez em 4.
  update public.ra_ocorrencias set status = 'cumprida', concluida_em = (data + time '15:00') at time zone 'America/Sao_Paulo'
   where tarefa_id = tC and data between segp and segp + 6 and data <> segp + 2;
  update public.ra_ocorrencias set status = 'cumprida', concluida_em = (data + time '15:00') at time zone 'America/Sao_Paulo'
   where tarefa_id = tT and data between segp and segp + 3;

  -- Desafio do Lucas: Estudo todo dia (meta 7), com dia coringa, +10 estrelinhas. Criado há 2 semanas.
  insert into public.ra_desafios(familia_id, membro_id, catalogo, titulo, tipo, alvo, categorias, meta, recompensa, estrelas, criado_por, criado_em)
  values (fam, C, 'k2', 'Estudo todo dia', 'dias', 'categoria', array[cat], 7, 'estrelas', 10, G, now() - interval '14 days') returning id into dC;
  -- Desafio da Júlia: 5 de 7 dias, semanas conquistadas.
  insert into public.ra_desafios(familia_id, membro_id, catalogo, titulo, tipo, alvo, categorias, meta, recompensa, criado_por, criado_em)
  values (fam, T, 'e1', 'Foco no Estudo', 'dias', 'categoria', array[cat], 5, 'semanas', G, now() - interval '14 days') returning id into dT;
  -- Desafio da família: 50% da semana, prêmio Pizza.
  insert into public.ra_desafios(familia_id, membro_id, catalogo, titulo, tipo, alvo, meta, recompensa, premio, criado_por, criado_em)
  values (fam, null, 'j1', 'Família em dia', 'pct', 'todas', 50, 'premio', 'Pizza no sábado', G, now() - interval '14 days') returning id into dF;
  -- Sequência de 3 para o Lucas (sem prêmio, só para medir).
  insert into public.ra_desafios(familia_id, membro_id, titulo, tipo, alvo, meta, coringa, recompensa, criado_por, criado_em)
  values (fam, C, 'Sequência de 3', 'seq', 'todas', 3, false, 'nenhuma', G, now() - interval '14 days') returning id into dS;

  select public.ra_desafios_atualizar() into n;
  select status into s from public.ra_desafio_periodos where desafio_id = dC and inicio = segp;
  if s = 'cumprido' then nok := nok + 1; r := r || E'OK  D3 6 de 7 dias com o dia coringa: desafio "todo dia" cumprido\n'; else nfalha := nfalha + 1; r := r || 'FALHA D3 status=' || coalesce(s, 'nulo') || E'\n'; end if;
  select detalhe into cj from public.ra_desafio_periodos where desafio_id = dC and inicio = segp;
  if cj->>'coringa' = (segp + 2)::text then nok := nok + 1; r := r || E'OK  D4 A quarta difícil virou dia coringa\n'; else nfalha := nfalha + 1; r := r || 'FALHA D4 ' || coalesce(cj->>'coringa', 'nulo') || E'\n'; end if;
  select coalesce(sum(valor), 0) into v from public.ra_cofrinho where membro_id = C and moeda = 'estrelas';
  if v = 10 then nok := nok + 1; r := r || E'OK  D5 +10 estrelinhas no cofrinho do Lucas\n'; else nfalha := nfalha + 1; r := r || 'FALHA D5 saldo=' || v || E'\n'; end if;
  select status into s from public.ra_desafio_periodos where desafio_id = dT and inicio = segp;
  if s = 'nao_cumprido' then nok := nok + 1; r := r || E'OK  D6 Júlia fez 4 de 5: semana fechada sem cumprir (sem castigo, só não ganha)\n'; else nfalha := nfalha + 1; r := r || 'FALHA D6 ' || coalesce(s, 'nulo') || E'\n'; end if;
  select status into s from public.ra_desafio_periodos where desafio_id = dF and inicio = segp;
  select count(*) into n from public.ra_premio_pedidos where familia_id = fam and membro_id is null and nome = 'Pizza no sábado';
  if s = 'cumprido' and n = 1 then nok := nok + 1; r := r || E'OK  D7 Família bateu 50%: Pizza no sábado aparece para os pais entregarem\n'; else nfalha := nfalha + 1; r := r || 'FALHA D7 ' || coalesce(s, 'nulo') || ' pedidos=' || n || E'\n'; end if;
  select progresso into v from public.ra_desafio_periodos where desafio_id = dS and inicio = segp;
  if v = 4 then nok := nok + 1; r := r || E'OK  D8 Sequência: maior sequência da semana passada = 4 dias\n'; else nfalha := nfalha + 1; r := r || 'FALHA D8 seq=' || coalesce(v, -1) || E'\n'; end if;
  perform public.ra_desafios_atualizar();
  select coalesce(sum(valor), 0) into v from public.ra_cofrinho where membro_id = C and moeda = 'estrelas';
  if v = 10 then nok := nok + 1; r := r || E'OK  D10 Abrir o app de novo não dá estrelinha em dobro\n'; else nfalha := nfalha + 1; r := r || 'FALHA D10 saldo=' || v || E'\n'; end if;
  select count(*) into n from public.ra_desafio_periodos where desafio_id = dC and inicio = seg;
  if n = 1 then nok := nok + 1; r := r || E'OK  D11 Semana nova começa sozinha (renova)\n'; else nfalha := nfalha + 1; r := r || E'FALHA D11\n'; end if;

  -- ===== Criança =====
  perform set_config('request.jwt.claims', json_build_object('sub', cU, 'email', 'des-cri@teste.local', 'role', 'authenticated')::text, true);
  select count(*) into n from public.ra_notificacoes where familia_id = fam and para_membro = C and titulo like 'Desafio cumprido%';
  if n >= 1 then nok := nok + 1; r := r || E'OK  D9 Lucas recebe o aviso de desafio cumprido\n'; else nfalha := nfalha + 1; r := r || E'FALHA D9\n'; end if;
  begin
    insert into public.ra_desafios(familia_id, membro_id, titulo, tipo, meta, criado_por) values (fam, C, 'Meu', 'dias', 3, C);
    nfalha := nfalha + 1; r := r || E'FALHA D12 criança criou desafio\n';
  exception when others then nok := nok + 1; r := r || E'OK  D12 Criança não cria desafio (os pais escolhem com ela)\n'; end;
  begin
    perform public.ra_premio_pedir(pr2, null);
    nfalha := nfalha + 1; r := r || E'FALHA D13 trocou sem saldo\n';
  exception when others then
    if sqlerrm like 'Ainda faltam 50 estrelinhas%' then nok := nok + 1; r := r || E'OK  D13 Sem estrelinhas suficientes: "Ainda faltam 50 estrelinhas"\n'; else nfalha := nfalha + 1; r := r || 'FALHA D13 ' || sqlerrm || E'\n'; end if;
  end;
  perform public.ra_premio_pedir(pr, null);
  select coalesce(sum(valor), 0) into v from public.ra_cofrinho where membro_id = C and moeda = 'estrelas';
  select id into ped from public.ra_premio_pedidos where membro_id = C and status = 'pedido';
  if v = 0 and ped is not null then nok := nok + 1; r := r || E'OK  D14 Lucas troca 10 estrelinhas pela sobremesa (fica esperando a entrega)\n'; else nfalha := nfalha + 1; r := r || 'FALHA D14 saldo=' || v || E'\n'; end if;
  begin
    perform public.ra_premio_entregar(ped, true);
    nfalha := nfalha + 1; r := r || E'FALHA D15 criança marcou entregue\n';
  exception when others then nok := nok + 1; r := r || E'OK  D15 Só os pais marcam "entregue"\n'; end;
  select count(*) into n from public.ra_cofrinho where membro_id = T;
  if n = 0 then nok := nok + 1; r := r || E'OK  D16 Criança não vê o cofrinho de outra pessoa\n'; else nfalha := nfalha + 1; r := r || E'FALHA D16\n'; end if;
  select count(*) into n from public.ra_desafios where membro_id = T;
  if n = 1 then nok := nok + 1; r := r || E'OK  D17 Mural aberto: a criança vê o desafio da irmã\n'; else nfalha := nfalha + 1; r := r || 'FALHA D17 n=' || n || E'\n'; end if;

  -- ===== Pai entrega e restringe o mural =====
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'des-pai@teste.local', 'role', 'authenticated')::text, true);
  perform public.ra_premio_entregar(ped, true);
  select status into s from public.ra_premio_pedidos where id = ped;
  if s = 'entregue' then nok := nok + 1; r := r || E'OK  D18 Pai marca o prêmio como entregue\n'; else nfalha := nfalha + 1; r := r || E'FALHA D18\n'; end if;
  update public.ra_familias set mural_visivel = 'pais' where id = fam;

  -- ===== Adolescente =====
  perform set_config('request.jwt.claims', json_build_object('sub', tU, 'email', 'des-ado@teste.local', 'role', 'authenticated')::text, true);
  select count(*) into n from public.ra_desafios where membro_id = C;
  if n = 0 then nok := nok + 1; r := r || E'OK  D19 Mural só para os pais: a adolescente não vê o desafio do irmão\n'; else nfalha := nfalha + 1; r := r || E'FALHA D19\n'; end if;
  insert into public.ra_desafios(familia_id, membro_id, catalogo, titulo, tipo, alvo, meta, recompensa, criado_por)
  values (fam, T, 'l1', 'Leitor da semana', 'dias', 'tarefa', 4, 'semanas', T) returning id into dT;
  nok := nok + 1; r := r || E'OK  D20 Adolescente escolhe o próprio desafio\n';
  perform public.ra_desafio_encerrar(dT);
  select ativo into b from public.ra_desafios where id = dT;
  if not b then nok := nok + 1; r := r || E'OK  D21 Adolescente encerra o próprio desafio\n'; else nfalha := nfalha + 1; r := r || E'FALHA D21\n'; end if;
  begin
    perform public.ra_desafio_encerrar(dC);
    nfalha := nfalha + 1; r := r || E'FALHA D22 encerrou desafio de outro\n';
  exception when others then nok := nok + 1; r := r || E'OK  D22 Não encerra o desafio de outra pessoa\n'; end;

  -- ===== Cálculos isolados =====
  execute 'reset role';
  select * into d from public.ra_desafios where id = dC;
  d.coringa := false;
  cj := public.ra_desafio_calc(d, segp, segp + 6, hoje);
  if (cj->>'cumprido')::boolean = false and (cj->>'meta')::int = 7 then nok := nok + 1; r := r || E'OK  D23 Sem dia coringa, 6 de 7 não cumpre "todo dia"\n'; else nfalha := nfalha + 1; r := r || 'FALHA D23 ' || cj::text || E'\n'; end if;
  d.tipo := 'pct'; d.meta := 80; d.coringa := true;
  cj := public.ra_desafio_calc(d, segp, segp + 6, hoje);
  if (cj->>'progresso')::int = 100 and (cj->>'cumprido')::boolean then nok := nok + 1; r := r || E'OK  D24 Percentual com o dia coringa tira o pior dia da conta\n'; else nfalha := nfalha + 1; r := r || 'FALHA D24 ' || cj::text || E'\n'; end if;

  raise exception E'RELATORIO_TESTES\n%\nTotal: % OK, % FALHA', r, nok, nfalha;
end $$;
