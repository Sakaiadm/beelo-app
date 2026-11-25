-- @arquivo  trilha_chegada.sql: testes do banco para o aviso de chegada (migração 0027).
-- @cuidado  roda numa transação e termina com RAISE EXCEPTION com o relatório: nada fica gravado.
-- Uso: depois de rodar as migrações num Postgres local (veja testes/banco-local.sh):
--   psql -d ra -f supabase/testes/trilha_chegada.sql
do $$
declare
  r text := ''; nok int := 0; nfalha int := 0; n int;
  d0 date := (now() at time zone 'America/Sao_Paulo')::date;
  gU uuid := gen_random_uuid(); f1U uuid := gen_random_uuid(); f2U uuid := gen_random_uuid();
  fam uuid; G uuid; F1 uuid; F2 uuid; tS uuid; tN uuid; oc uuid; oc2 uuid; oc3 uuid;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (gU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-pai@teste.local', '{}', '{}', now(), now()),
         (f1U, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-f1@teste.local', '{}', '{}', now(), now()),
         (f2U, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-f2@teste.local', '{}', '{}', now(), now());
  insert into public.ra_familias(nome) values ('TESTE') returning id into fam;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id) values (fam, 'teste-pai@teste.local', 'Pai Teste', 'gestor', gU) returning id into G;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id) values (fam, 'teste-f1@teste.local', 'Filho1', 'filho', f1U) returning id into F1;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id) values (fam, 'teste-f2@teste.local', 'Filho2', 'filho', f2U) returning id into F2;

  insert into public.ra_tarefas(familia_id, titulo, responsavel_id, tipo, data_inicio, hora_inicio, criada_por, especial, chegada_lembrar, chegada_avisar_pais)
    values (fam, 'Chegar na escola', F1, 'pontual', d0, ((now() at time zone 'America/Sao_Paulo') - interval '40 minutes')::time, G, 'chegada', true, true) returning id into tS;
  insert into public.ra_ocorrencias(tarefa_id, familia_id, membro_id, data, hora_inicio)
    values (tS, fam, F1, d0, ((now() at time zone 'America/Sao_Paulo') - interval '40 minutes')::time) returning id into oc;
  insert into public.ra_tarefas(familia_id, titulo, responsavel_id, tipo, data_inicio, criada_por)
    values (fam, 'Arrumar a cama', F1, 'pontual', d0, G) returning id into tN;
  insert into public.ra_ocorrencias(tarefa_id, familia_id, membro_id, data) values (tN, fam, F1, d0) returning id into oc3;
  delete from public.ra_notificacoes where familia_id = fam;

  if ((now() at time zone 'America/Sao_Paulo') - interval '40 minutes')::date = d0 then
    perform public.ra_gerar_lembretes(); perform public.ra_gerar_lembretes();
    select count(*) into n from public.ra_notificacoes where para_membro = F1 and titulo like 'Já chegou na escola?%';
    if n = 1 then nok := nok + 1; r := r || E'OK  1 Lembrete suave só para o filho, uma vez\n'; else nfalha := nfalha + 1; r := r || 'FALHA 1 n=' || n || E'\n'; end if;
    select count(*) into n from public.ra_notificacoes where para_membro = G and titulo like 'Ainda sem confirmação:%';
    if n = 1 then nok := nok + 1; r := r || E'OK  2 Aviso leve aos pais (ligado na tarefa), uma vez\n'; else nfalha := nfalha + 1; r := r || 'FALHA 2 n=' || n || E'\n'; end if;
  else nok := nok + 1; r := r || E'OK  1 e 2 (pulados perto da meia-noite)\n'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', f2U, 'email', 'teste-f2@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin perform public.ra_cheguei(oc); nfalha := nfalha + 1; r := r || E'FALHA 3 outro filho avisou a chegada alheia\n';
  exception when others then nok := nok + 1; r := r || E'OK  3 Só a própria pessoa avisa a chegada\n'; end;
  perform set_config('request.jwt.claims', json_build_object('sub', f1U, 'email', 'teste-f1@teste.local', 'role', 'authenticated')::text, true);
  perform public.ra_cheguei(oc);
  perform public.ra_cheguei(oc);
  begin perform public.ra_cheguei(oc3); nfalha := nfalha + 1; r := r || E'FALHA 7 aceitou tarefa que não é de chegada\n';
  exception when others then nok := nok + 1; r := r || E'OK  7 Só tarefa de chegada aceita o toque\n'; end;
  execute 'reset role';

  select count(*) into n from public.ra_ocorrencias where id = oc and status = 'cumprida' and conferido = 'conferido' and concluida_em is not null;
  if n = 1 then nok := nok + 1; r := r || E'OK  4 O toque marca como feita e já conferida\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4\n'; end if;
  select count(*) into n from public.ra_notificacoes where para_membro = G and titulo like 'Filho1 chegou na escola, %';
  if n = 1 then nok := nok + 1; r := r || E'OK  5 Os pais recebem um aviso positivo só (tocar de novo não repete)\n'; else nfalha := nfalha + 1; r := r || 'FALHA 5 n=' || n || E'\n'; end if;

  update public.ra_membros set notif = '{"chegada":false}' where id = G;
  delete from public.ra_ocorrencias where id = oc; 
  insert into public.ra_ocorrencias(tarefa_id, familia_id, membro_id, data) values (tS, fam, F1, d0 - 1) returning id into oc2;
  perform public.ra_gerar_lembretes();
  select count(*) into n from public.ra_ocorrencias where id = oc2 and status = 'cancelada';
  if n = 1 then nok := nok + 1; r := r || E'OK  6 Chegada de ontem sem toque vira cancelada (sem atraso)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 6\n'; end if;

  raise exception E'RELATORIO_TESTES\nAprovados: %  Falhas: %\n%', nok, nfalha, r;
end $$;
