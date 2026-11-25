-- @arquivo trilha_sugestao_desafio.sql: teste do SQL 0027 (criança sugere desafio, Pai/Mãe respondem). Transação que termina em RAISE com o relatório.
-- Uso: depois de bash testes/banco-local.sh, rode: psql -h /var/tmp/pgra -p 5499 -U postgres -d ra -f supabase/testes/trilha_sugestao_desafio.sql
do $$
declare
  r text := ''; nok int := 0; nfalha int := 0;
  gU uuid := gen_random_uuid(); cU uuid := gen_random_uuid(); oU uuid := gen_random_uuid();
  fam uuid; G uuid; C uuid; s1 uuid; n int; st text; pai text; cri text; outra text; ok boolean;
begin
  insert into auth.users(id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
    (gU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ds-pai@teste.local', '{}', '{}', now(), now()),
    (cU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ds-cri@teste.local', '{}', '{}', now(), now()),
    (oU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ds-out@teste.local', '{}', '{}', now(), now());
  insert into public.ra_familias(nome, desafios_beta) values ('SUGESTAO', true) returning id into fam;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id) values (fam, 'ds-pai@teste.local', 'Pai', 'gestor', gU) returning id into G;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id, modo_crianca, funcao) values (fam, 'ds-cri@teste.local', 'Lucas', 'filho', cU, true, 'filho') returning id into C;
  insert into public.ra_membros(familia_id, email, nome, papel, user_id, modo_crianca, funcao) values (fam, 'ds-out@teste.local', 'Ana', 'filho', oU, true, 'filho');
  pai := json_build_object('sub', gU, 'email', 'ds-pai@teste.local', 'role', 'authenticated')::text;
  cri := json_build_object('sub', cU, 'email', 'ds-cri@teste.local', 'role', 'authenticated')::text;
  outra := json_build_object('sub', oU, 'email', 'ds-out@teste.local', 'role', 'authenticated')::text;

  perform set_config('request.jwt.claims', cri, true); execute 'set local role authenticated';
  s1 := public.ra_desafio_sugerir('c1', 'Constância');
  if s1 is not null then nok := nok + 1; r := r || E'OK  S1 Criança sugere um desafio\n'; else nfalha := nfalha + 1; r := r || E'FALHOU S1\n'; end if;
  begin perform public.ra_desafio_sugerir('c1', 'Constância'); ok := false; exception when others then ok := true; end;
  if ok then nok := nok + 1; r := r || E'OK  S2 Não repete o mesmo desafio esperando\n'; else nfalha := nfalha + 1; r := r || E'FALHOU S2\n'; end if;
  perform public.ra_desafio_sugerir('c3', 'Começo leve');
  begin perform public.ra_desafio_sugerir('c5', 'Outro'); ok := false; exception when others then ok := true; end;
  if ok then nok := nok + 1; r := r || E'OK  S3 No máximo 2 esperando\n'; else nfalha := nfalha + 1; r := r || E'FALHOU S3\n'; end if;
  begin perform public.ra_desafio_sugestao_fechar(s1, 'criado'); ok := false; exception when others then ok := true; end;
  if ok then nok := nok + 1; r := r || E'OK  S4 Criança não fecha a sugestão\n'; else nfalha := nfalha + 1; r := r || E'FALHOU S4\n'; end if;
  select count(*) into n from public.ra_desafio_sugestoes; 
  if n = 2 then nok := nok + 1; r := r || E'OK  S5 Criança vê só as próprias\n'; else nfalha := nfalha + 1; r := r || format(E'FALHOU S5 (%s)\n', n); end if;

  execute 'reset role'; perform set_config('request.jwt.claims', outra, true); execute 'set local role authenticated';
  select count(*) into n from public.ra_desafio_sugestoes;
  if n = 0 then nok := nok + 1; r := r || E'OK  S6 Outra criança não vê as sugestões do irmão\n'; else nfalha := nfalha + 1; r := r || E'FALHOU S6\n'; end if;

  execute 'reset role'; perform set_config('request.jwt.claims', pai, true); execute 'set local role authenticated';
  select count(*) into n from public.ra_desafio_sugestoes where status = 'esperando';
  if n = 2 then nok := nok + 1; r := r || E'OK  S7 Pai vê as 2 esperando\n'; else nfalha := nfalha + 1; r := r || E'FALHOU S7\n'; end if;
  perform public.ra_desafio_sugestao_fechar(s1, 'agora_nao');
  select status into st from public.ra_desafio_sugestoes where id = s1;
  if st = 'agora_nao' then nok := nok + 1; r := r || E'OK  S8 Pai responde "agora não"\n'; else nfalha := nfalha + 1; r := r || E'FALHOU S8\n'; end if;
  begin insert into public.ra_desafio_sugestoes(familia_id, membro_id, catalogo, titulo) values (fam, C, 'c1', 'x'); ok := false; exception when others then ok := true; end;
  if ok then nok := nok + 1; r := r || E'OK  S9 Ninguém grava direto na tabela\n'; else nfalha := nfalha + 1; r := r || E'FALHOU S9\n'; end if;
  execute 'reset role';
  raise exception E'\nTRILHA SUGESTÃO DE DESAFIO: % ok, % falharam\n%', nok, nfalha, r;
end $$;
