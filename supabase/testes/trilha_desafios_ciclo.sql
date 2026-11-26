-- @arquivo trilha_desafios_ciclo.sql: teste do SQL 0031 (ciclo de 4 semanas, limite no banco, renovar, 1 troca por semana). Transação que termina em RAISE com o relatório.
-- @tipo    teste
-- Uso: depois de bash testes/banco-local.sh, rode: psql -h /var/tmp/pgra -p 5499 -U postgres -d ra -f supabase/testes/trilha_desafios_ciclo.sql
do $$
declare
  r text := ''; nok int := 0; nfalha int := 0; ok boolean; n int; v date; t timestamptz; msg text;
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  seg date := hoje - ((extract(dow from hoje)::int + 6) % 7);
  gU uuid := gen_random_uuid(); cU uuid := gen_random_uuid();
  fam uuid; G uuid; C uuid; dA uuid; dB uuid; dC uuid; dF uuid; pai text;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
    (gU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ci-pai@teste.local', '{}', '{}', now(), now()),
    (cU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ci-cri@teste.local', '{}', '{}', now(), now());
  insert into public.ra_familias(nome, desafios_beta) values ('CICLO', true) returning id into fam;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id) values (fam, 'ci-pai@teste.local', 'Pai', 'gestor', gU) returning id into G;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id, modo_crianca, funcao) values (fam, 'ci-cri@teste.local', 'Lucas', 'filho', cU, true, 'filho') returning id into C;
  pai := json_build_object('sub', gU, 'email', 'ci-pai@teste.local', 'role', 'authenticated')::text;
  perform set_config('request.jwt.claims', pai, true); execute 'set local role authenticated';

  -- dA: criado há 35 dias, o ciclo de 4 semanas já acabou.
  insert into public.ra_desafios(familia_id, membro_id, titulo, tipo, alvo, meta, recompensa, criado_por, criado_em)
  values (fam, C, 'Estudo', 'dias', 'todas', 5, 'nenhuma', G, now() - interval '35 days') returning id into dA;
  select ciclo_fim - ciclo_inicio into n from public.ra_desafios where id = dA;
  if n = 27 then nok := nok + 1; r := r || E'OK  L1 Ciclo padrão de 4 semanas (28 dias)\n'; else nfalha := nfalha + 1; r := r || format(E'FALHOU L1 (%s)\n', n); end if;

  perform public.ra_desafios_atualizar();
  select count(*) into n from public.ra_desafio_periodos where desafio_id = dA;
  if n = 4 then nok := nok + 1; r := r || E'OK  L2 Só 4 semanas geradas: não renova sozinho\n'; else nfalha := nfalha + 1; r := r || format(E'FALHOU L2 (%s períodos)\n', n); end if;
  select count(*) into n from public.ra_desafios where id = dA and descansando_em is not null and ciclo_feitas is not null;
  if n = 1 then nok := nok + 1; r := r || E'OK  L3 Fim do ciclo: descansa e guarda o balanço\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L3\n'; end if;
  select count(*) into n from public.ra_notificacoes where familia_id = fam and titulo like 'O ciclo de Lucas terminou%';
  if n = 1 then nok := nok + 1; r := r || E'OK  L4 Pai recebe o aviso de fim de ciclo\n'; else nfalha := nfalha + 1; r := r || format(E'FALHOU L4 (%s)\n', n); end if;
  perform public.ra_desafios_atualizar();
  select count(*) into n from public.ra_notificacoes where familia_id = fam and titulo like 'O ciclo de Lucas terminou%';
  if n = 1 then nok := nok + 1; r := r || E'OK  L5 O aviso vem uma vez só\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L5\n'; end if;

  -- Descansando não conta no limite: dá para começar mais 2.
  insert into public.ra_desafios(familia_id, membro_id, titulo, tipo, alvo, meta, recompensa, criado_por) values (fam, C, 'Leitura', 'dias', 'todas', 4, 'nenhuma', G) returning id into dB;
  nok := nok + 1; r := r || E'OK  L6 Desafio descansando não conta no limite de 2\n';

  -- Renovar: volta a contar, ciclo começa nesta semana, meta sobe.
  perform public.ra_desafio_renovar(dA, 4, 6);
  select ciclo_inicio into v from public.ra_desafios where id = dA;
  select count(*) into n from public.ra_desafios where id = dA and descansando_em is null and meta = 6 and ciclo_fim = seg + 27;
  if v = seg and n = 1 then nok := nok + 1; r := r || E'OK  L7 Renovar: ciclo novo nesta semana e meta subiu\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L7\n'; end if;
  perform public.ra_desafios_atualizar();
  select count(*) into n from public.ra_desafio_periodos where desafio_id = dA and inicio >= seg;
  if n = 1 then nok := nok + 1; r := r || E'OK  L8 Depois de renovar, a semana atual começa (sem recuperar o descanso)\n'; else nfalha := nfalha + 1; r := r || format(E'FALHOU L8 (%s)\n', n); end if;

  -- Limite no banco: o 3º desafio da pessoa é recusado.
  begin insert into public.ra_desafios(familia_id, membro_id, titulo, tipo, alvo, meta, recompensa, criado_por) values (fam, C, 'Terceiro', 'dias', 'todas', 3, 'nenhuma', G); ok := false;
  exception when others then ok := true; get stacked diagnostics msg = message_text; end;
  if ok and msg like '%2 desafios%' then nok := nok + 1; r := r || E'OK  L9 O banco recusa o 3º desafio da pessoa\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L9\n'; end if;
  insert into public.ra_desafios(familia_id, membro_id, titulo, tipo, alvo, meta, recompensa, criado_por) values (fam, null, 'Família', 'pct', 'todas', 80, 'nenhuma', G) returning id into dF;
  begin insert into public.ra_desafios(familia_id, membro_id, titulo, tipo, alvo, meta, recompensa, criado_por) values (fam, null, 'Outra', 'pct', 'todas', 80, 'nenhuma', G); ok := false; exception when others then ok := true; end;
  if ok then nok := nok + 1; r := r || E'OK  L10 O banco recusa o 2º desafio da família\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L10\n'; end if;

  -- Renovar no meio do ciclo não pode.
  begin perform public.ra_desafio_renovar(dA); ok := false; exception when others then ok := true; end;
  if ok then nok := nok + 1; r := r || E'OK  L11 Não renova no meio do ciclo\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L11\n'; end if;

  -- Troca: 1 por semana. dB foi criado agora (menos de 1 dia): desfazer não conta como troca.
  perform public.ra_desafio_encerrar(dB);
  select count(*) into n from public.ra_desafios where id = dB and not encerrado_troca;
  if n = 1 then nok := nok + 1; r := r || E'OK  L12 Desfazer um desafio recém-criado não conta como troca\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L12\n'; end if;
  execute 'reset role'; update public.ra_desafios set criado_em = now() - interval '3 days' where id = dA;
  insert into public.ra_desafios(familia_id, membro_id, titulo, tipo, alvo, meta, recompensa, criado_por, criado_em) values (fam, C, 'Água', 'dias', 'todas', 5, 'nenhuma', G, now() - interval '3 days') returning id into dC;
  perform set_config('request.jwt.claims', pai, true); execute 'set local role authenticated';
  perform public.ra_desafio_encerrar(dA);
  select count(*) into n from public.ra_desafios where id = dA and encerrado_troca;
  if n = 1 then nok := nok + 1; r := r || E'OK  L13 Encerrar no meio do ciclo conta como troca\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L13\n'; end if;
  begin perform public.ra_desafio_encerrar(dC); ok := false; exception when others then ok := true; get stacked diagnostics msg = message_text; end;
  if ok and msg like 'Já houve uma troca%' then nok := nok + 1; r := r || E'OK  L14 A 2ª troca da mesma semana é recusada com mensagem amigável\n'; else nfalha := nfalha + 1; r := r || E'FALHOU L14\n'; end if;

  execute 'reset role';
  raise exception E'\nTRILHA CICLO DOS DESAFIOS: % ok, % falharam\n%', nok, nfalha, r;
end $$;
