-- Trilha de testes da Lista de desejos (SQL 0017). Roda numa transação e termina com RAISE EXCEPTION com o relatório:
-- nada fica gravado. Uso: depois de bash testes/banco-local.sh, rode
--   psql -h /var/tmp/pgra -p 5499 -U postgres -d ra -f supabase/testes/trilha_desejos.sql
do $$
declare
  r text := ''; nok int := 0; nfalha int := 0;
  gU uuid := gen_random_uuid(); cU uuid := gen_random_uuid(); tU uuid := gen_random_uuid();
  fam uuid; G uuid; C uuid; T uuid; w1 uuid; w2 uuid; w3 uuid; w4 uuid; wt uuid; n int; s text; pr public.ra_premios;
  pai text; cri text; ado text;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
    (gU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dj-pai@teste.local', '{}', '{}', now(), now()),
    (cU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dj-cri@teste.local', '{}', '{}', now(), now()),
    (tU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dj-ado@teste.local', '{}', '{}', now(), now());
  insert into public.ra_familias(nome, desafios_beta) values ('DESEJOS', true) returning id into fam;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id) values (fam, 'dj-pai@teste.local', 'Pai', 'gestor', gU) returning id into G;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id, modo_crianca, funcao) values (fam, 'dj-cri@teste.local', 'Lucas', 'filho', cU, true, 'filho') returning id into C;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id, funcao) values (fam, 'dj-ado@teste.local', 'Julia', 'filho', tU, 'filho') returning id into T;
  pai := json_build_object('sub', gU, 'email', 'dj-pai@teste.local', 'role', 'authenticated')::text;
  cri := json_build_object('sub', cU, 'email', 'dj-cri@teste.local', 'role', 'authenticated')::text;
  ado := json_build_object('sub', tU, 'email', 'dj-ado@teste.local', 'role', 'authenticated')::text;

  -- ===== Criança sugere =====
  perform set_config('request.jwt.claims', cri, true);
  execute 'set local role authenticated';
  w1 := public.ra_desejo_sugerir('Patins', null);
  w2 := public.ra_desejo_sugerir('Bicicleta nova', 'outra-familia/x/foto.jpg');
  w3 := public.ra_desejo_sugerir('Lego', null);
  select * into pr from public.ra_premios where id = w1;
  if pr.desejo = 'esperando' and not pr.ativo and pr.moeda = 'estrelas' and pr.membro_id = C then nok := nok + 1; r := r || E'OK  W1 Criança sugere um desejo (fica esperando, fora da vitrine)\n'; else nfalha := nfalha + 1; r := r || E'FALHA W1\n'; end if;
  select foto into s from public.ra_premios where id = w2;
  if s is null then nok := nok + 1; r := r || E'OK  W2 Foto de outra pasta é ignorada\n'; else nfalha := nfalha + 1; r := r || E'FALHA W2\n'; end if;
  begin
    w4 := public.ra_desejo_sugerir('Quarto desejo', null);
    nfalha := nfalha + 1; r := r || E'FALHA W3 aceitou o 4º desejo\n';
  exception when others then nok := nok + 1; r := r || E'OK  W3 Limite de 3 desejos esperando\n'; end;
  begin
    perform public.ra_desejo_responder(w1, true, 'Patins', 80, null, null);
    nfalha := nfalha + 1; r := r || E'FALHA W4 criança aprovou\n';
  exception when others then nok := nok + 1; r := r || E'OK  W4 A criança não aprova o próprio desejo\n'; end;
  begin
    update public.ra_premios set custo = 1, ativo = true where id = w1;
    select ativo into pr.ativo from public.ra_premios where id = w1;
    if pr.ativo then nfalha := nfalha + 1; r := r || E'FALHA W5 criança mudou o preço\n'; else nok := nok + 1; r := r || E'OK  W5 A criança não muda o preço\n'; end if;
  exception when others then nok := nok + 1; r := r || E'OK  W5 A criança não muda o preço\n'; end;

  -- ===== Adolescente sugere (em semanas) =====
  execute 'reset role';
  perform set_config('request.jwt.claims', ado, true);
  execute 'set local role authenticated';
  wt := public.ra_desejo_sugerir('Show com amigos', null);
  select moeda into s from public.ra_premios where id = wt;
  if s = 'semanas' then nok := nok + 1; r := r || E'OK  W6 Desejo do adolescente vale em semanas\n'; else nfalha := nfalha + 1; r := r || E'FALHA W6\n'; end if;

  -- ===== Pais respondem =====
  execute 'reset role';
  select count(*) into n from public.ra_notificacoes where para_membro = G and titulo like 'Lucas sugeriu um desejo%';
  if n = 3 then nok := nok + 1; r := r || E'OK  W7 Os pais recebem um aviso por desejo\n'; else nfalha := nfalha + 1; r := r || 'FALHA W7 ' || n || E'\n'; end if;
  perform set_config('request.jwt.claims', pai, true);
  execute 'set local role authenticated';
  perform public.ra_desejo_responder(w1, true, 'Patins com joelheira', 80, null, null);
  select * into pr from public.ra_premios where id = w1;
  if pr.ativo and pr.desejo = 'aprovado' and pr.custo = 80 and pr.nome = 'Patins com joelheira' and pr.sugerido = 'Patins' then nok := nok + 1; r := r || E'OK  W8 Pai aprova com nome ajustado e preço\n'; else nfalha := nfalha + 1; r := r || E'FALHA W8\n'; end if;
  if (select cofrinho_meta from public.ra_membros where id = C) = w1 then nok := nok + 1; r := r || E'OK  W9 Desejo aprovado vira a meta do cofrinho\n'; else nfalha := nfalha + 1; r := r || E'FALHA W9\n'; end if;
  perform public.ra_desejo_responder(w2, false, null, null, null, 'Esse fica para uma data especial, combinado?');
  select * into pr from public.ra_premios where id = w2;
  if pr.desejo = 'agora_nao' and not pr.ativo and pr.resposta like 'Esse fica%' then nok := nok + 1; r := r || E'OK  W10 "Agora não" guarda a mensagem e não entra na vitrine\n'; else nfalha := nfalha + 1; r := r || E'FALHA W10\n'; end if;
  begin
    perform public.ra_desejo_responder(w3, true, 'Lego', 0, null, null);
    nfalha := nfalha + 1; r := r || E'FALHA W11 aceitou preço 0\n';
  exception when others then nok := nok + 1; r := r || E'OK  W11 Preço precisa ser de 1 a 1000\n'; end;
  begin
    perform public.ra_desejo_responder(w1, true, 'Patins', 10, null, null);
    nfalha := nfalha + 1; r := r || E'FALHA W12 respondeu de novo\n';
  exception when others then nok := nok + 1; r := r || E'OK  W12 Desejo já respondido não muda pela aprovação\n'; end;
  perform public.ra_desejo_responder(w3, true, 'Lego grande', 300, 'Guardar as peças na caixa', null);
  if (select regra from public.ra_premios where id = w3) = 'Guardar as peças na caixa' then nok := nok + 1; r := r || E'OK  W13 Prêmio grande guarda a regra combinada\n'; else nfalha := nfalha + 1; r := r || E'FALHA W13\n'; end if;

  -- ===== Criança vê a resposta e volta a poder sugerir =====
  execute 'reset role';
  select count(*) into n from public.ra_notificacoes where para_membro = C and (titulo like 'Os pais aprovaram%' or titulo like 'Sobre o desejo%');
  if n = 3 then nok := nok + 1; r := r || E'OK  W14 A criança recebe as respostas\n'; else nfalha := nfalha + 1; r := r || 'FALHA W14 ' || n || E'\n'; end if;
  perform set_config('request.jwt.claims', cri, true);
  execute 'set local role authenticated';
  w4 := public.ra_desejo_sugerir('Jogo de tabuleiro', null);
  if w4 is not null then nok := nok + 1; r := r || E'OK  W15 Com os desejos respondidos, pode sugerir de novo\n'; else nfalha := nfalha + 1; r := r || E'FALHA W15\n'; end if;
  -- Trocar o desejo aprovado quando juntar (usa o fluxo de prêmios do 0016).
  execute 'reset role';
  insert into public.ra_cofrinho(familia_id, membro_id, moeda, valor, motivo) values (fam, C, 'estrelas', 90, 'teste');
  perform set_config('request.jwt.claims', cri, true);
  execute 'set local role authenticated';
  perform public.ra_premio_pedir(w1, null);
  execute 'reset role';
  if (select cofrinho_meta from public.ra_membros where id = C) is null and (select sum(valor) from public.ra_cofrinho where membro_id = C) = 10 then nok := nok + 1; r := r || E'OK  W16 Ao juntar, troca o desejo como qualquer prêmio\n'; else nfalha := nfalha + 1; r := r || 'FALHA W16 meta=' || coalesce((select cofrinho_meta::text from public.ra_membros where id = C),'null') || ' soma=' || coalesce((select sum(valor)::text from public.ra_cofrinho where membro_id = C),'null') || E'\n'; end if;

  -- ===== Pai não sugere =====
  perform set_config('request.jwt.claims', pai, true);
  execute 'set local role authenticated';
  begin
    perform public.ra_desejo_sugerir('Viagem', null);
    nfalha := nfalha + 1; r := r || E'FALHA W17 pai sugeriu\n';
  exception when others then nok := nok + 1; r := r || E'OK  W17 Só os filhos sugerem desejos\n'; end;
  execute 'reset role';

  raise exception E'RELATORIO_TESTES\n%\nTotal: % OK, % FALHA', r, nok, nfalha;
end $$;
