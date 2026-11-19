-- Trilha de testes do banco do Rotina Ativa.
-- Roda tudo dentro de uma transação e termina com RAISE EXCEPTION contendo o relatório:
-- assim NADA fica gravado (todos os dados de teste são desfeitos automaticamente).
do $$
declare
  r text := '';
  nok int := 0; nfalha int := 0;
  d0 date := (now() at time zone 'America/Sao_Paulo')::date;
  gU uuid := gen_random_uuid(); f1U uuid := gen_random_uuid(); f2U uuid := gen_random_uuid(); xU uuid := gen_random_uuid();
  fam uuid; fam2 uuid; G uuid; G2 uuid; F1 uuid; F2 uuid; F3 uuid; cat uuid;
  tP uuid; tL uuid; tD uuid; tS uuid; tM uuid; tF uuid;
  oc uuid; oc2 uuid; adi uuid; prop uuid;
  n int; b boolean; t text; m public.ra_membros;
  rec record;
begin
  -- ===== Preparação (como administrador) =====
  insert into auth.users(id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (gU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-pai@teste.local', '{}', '{}', now(), now()),
         (f1U, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-f1@teste.local', '{}', '{}', now(), now()),
         (f2U, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-f2@teste.local', '{}', '{}', now(), now()),
         (xU, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-estranho@teste.local', '{}', '{}', now(), now());
  insert into public.ra_familias(nome) values ('TESTE') returning id into fam;
  insert into public.ra_membros(familia_id, email, nome, papel) values (fam, 'teste-pai@teste.local', 'Pai Teste', 'gestor') returning id into G;
  insert into public.ra_membros(familia_id, email, nome, papel) values (fam, 'TESTE-F1@teste.local', 'Filho1', 'filho') returning id into F1;
  insert into public.ra_membros(familia_id, email, nome, papel) values (fam, 'teste-f2@teste.local', 'Filho2', 'filho') returning id into F2;

  -- ===== 1. Login e vínculo (pai) =====
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'teste-pai@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  m := public.ra_vincular();
  if m.id = G then nok := nok + 1; r := r || E'OK  1.1 Pai entra e é vinculado ao convite pelo e-mail\n'; else nfalha := nfalha + 1; r := r || E'FALHA 1.1 vínculo do pai\n'; end if;
  if public.ra_sou_gestor() and public.ra_minha_familia() = fam then nok := nok + 1; r := r || E'OK  1.2 Pai reconhecido como gestor da família\n'; else nfalha := nfalha + 1; r := r || E'FALHA 1.2 papel do pai\n'; end if;
  select count(*) into n from public.ra_membros;
  if n = 3 then nok := nok + 1; r := r || E'OK  1.3 Pai vê só os 3 membros da própria família (não vê a família real)\n'; else nfalha := nfalha + 1; r := r || 'FALHA 1.3 membros visíveis=' || n || E'\n'; end if;

  -- ===== 2. Cadastros do pai =====
  insert into public.ra_categorias(familia_id, nome, cor, ordem) values (fam, 'Estudo', 'indigo', 1) returning id into cat;
  nok := nok + 1; r := r || E'OK  2.1 Pai cadastra categoria\n';
  insert into public.ra_membros(familia_id, email, nome, papel) values (fam, 'teste-f3@teste.local', 'Filho3', 'filho') returning id into F3;
  nok := nok + 1; r := r || E'OK  2.2 Pai cadastra novo membro (convite por e-mail)\n';
  update public.ra_membros set tela_ativo = false where id = F2; get diagnostics n = row_count;
  if n = 1 then nok := nok + 1; r := r || E'OK  2.3 Pai edita membro (desliga tempo de tela do Filho2)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 2.3 editar membro\n'; end if;
  begin
    insert into public.ra_membros(familia_id, nome, papel) values ((select id from public.ra_familias where nome = 'Nossa família' limit 1), 'Intruso', 'filho');
    nfalha := nfalha + 1; r := r || E'FALHA 2.4 pai inseriu membro em OUTRA família\n';
  exception when others then nok := nok + 1; r := r || E'OK  2.4 Pai NÃO consegue mexer em outra família\n'; end;

  perform public.ra_minhas_notif('{"concluida":"com_foto","justificativa":false,"adiamento":true,"tela":true,"tarefa_filho":true}');
  select notif->>'concluida' into t from public.ra_membros where id = G;
  if t = 'com_foto' then nok := nok + 1; r := r || E'OK  2.5 Pai escolhe os próprios avisos (só conclusão com foto, sem justificativas)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 2.5 preferências\n'; end if;
  insert into public.ra_membros(familia_id, email, nome, papel, notif) values (fam, 'teste-mae@teste.local', 'Mãe Teste', 'gestor', '{"concluida":"nenhuma"}') returning id into G2;
  select justificativa_obrigatoria into b from public.ra_familias where id = fam;
  if b = false then nok := nok + 1; r := r || E'OK  2.5b Justificativa começa como opcional (padrão)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 2.5b padrão da justificativa\n'; end if;
  update public.ra_familias set nome = 'TESTE 2', justificativa_obrigatoria = true, avatar = 'preset:m3' where id = fam; get diagnostics n = row_count;
  if n = 1 then nok := nok + 1; r := r || E'OK  2.6 Pai edita a família (nome, avatar pronto, justificativa obrigatória)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 2.6 editar família\n'; end if;
  update public.ra_categorias set nome = 'Estudos', cor = 'ciano' where id = cat; get diagnostics n = row_count;
  if n = 1 then nok := nok + 1; r := r || E'OK  2.7 Pai edita categoria (nome e cor)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 2.7\n'; end if;
  begin perform public.ra_admin_familias(); nfalha := nfalha + 1; r := r || E'FALHA 2.8 pai comum viu todas as famílias\n';
  exception when others then nok := nok + 1; r := r || E'OK  2.8 Pai comum NÃO vê a lista de todas as famílias (só o administrador)\n'; end;

  -- ===== 3. Tarefas criadas pelo pai =====
  insert into public.ra_tarefas(familia_id, titulo, categoria_id, responsavel_id, tipo, data_inicio, hora_inicio, hora_fim, exige_foto, criada_por)
  values (fam, 'Arrumar quarto', cat, F1, 'pontual', d0, '08:00', '09:00', true, G) returning id into tP;
  insert into public.ra_tarefas(familia_id, titulo, categoria_id, responsavel_id, tipo, recorrencia, data_inicio, criada_por, permite_adiar)
  values (fam, 'Estudar 1h', cat, F1, 'recorrente', 'diaria', d0 - 3, G, true) returning id into tD;
  insert into public.ra_tarefas(familia_id, titulo, responsavel_id, tipo, data_inicio, criada_por, exige_justificativa)
  values (fam, 'Lição de casa', F1, 'pontual', d0 - 1, G, true) returning id into tL;
  insert into public.ra_tarefas(familia_id, titulo, responsavel_id, tipo, recorrencia, dias_semana, data_inicio, criada_por)
  values (fam, 'Academia', F2, 'recorrente', 'dias_semana', '{1,3,5}', d0 - 3, G) returning id into tS;
  insert into public.ra_tarefas(familia_id, titulo, responsavel_id, tipo, recorrencia, data_inicio, criada_por)
  values (fam, 'Pagar conta', F1, 'recorrente', 'mensal', d0 - 3, G) returning id into tM;
  nok := nok + 1; r := r || E'OK  3.1 Pai cria tarefas: pontual com horário e foto, diária, dias da semana, mensal\n';
  perform public.ra_gerar_ocorrencias(d0 - 3, d0 + 7);
  select count(*) into n from public.ra_ocorrencias where tarefa_id = tD;
  if n = 11 then nok := nok + 1; r := r || E'OK  3.2 Diária gera 11 dias na agenda (3 atrás + hoje + 7 à frente)\n'; else nfalha := nfalha + 1; r := r || 'FALHA 3.2 diária gerou ' || n || E'\n'; end if;
  select count(*) into n from public.ra_ocorrencias where tarefa_id = tS and extract(dow from data)::int not in (1,3,5);
  if n = 0 and exists(select 1 from public.ra_ocorrencias where tarefa_id = tS) then nok := nok + 1; r := r || E'OK  3.3 "Dias da semana" só cai em seg/qua/sex\n'; else nfalha := nfalha + 1; r := r || E'FALHA 3.3 dias da semana\n'; end if;
  select count(*) into n from public.ra_ocorrencias where tarefa_id = tM;
  if n = 1 then nok := nok + 1; r := r || E'OK  3.4 Mensal gera 1 vez no período\n'; else nfalha := nfalha + 1; r := r || 'FALHA 3.4 mensal gerou ' || n || E'\n'; end if;
  perform public.ra_gerar_ocorrencias(d0 - 3, d0 + 7);
  select count(*) into n from public.ra_ocorrencias where tarefa_id = tD;
  if n = 11 then nok := nok + 1; r := r || E'OK  3.5 Gerar de novo não duplica tarefas\n'; else nfalha := nfalha + 1; r := r || E'FALHA 3.5 duplicou\n'; end if;
  update public.ra_tarefas set hora_inicio = '19:00', hora_fim = '20:00' where id = tD; get diagnostics n = row_count;
  if n = 1 then nok := nok + 1; r := r || E'OK  3.6 Pai edita tarefa (horário)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 3.6 editar tarefa\n'; end if;

  -- ===== 4. Filho 1 =====
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', f1U, 'email', 'teste-f1@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  m := public.ra_vincular();
  if m.id = F1 then nok := nok + 1; r := r || E'OK  4.1 Filho entra e é vinculado (e-mail com maiúsculas/minúsculas diferentes)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.1 vínculo do filho\n'; end if;
  select count(*) into n from public.ra_notificacoes where titulo like 'Nova tarefa:%';
  if n = 4 then nok := nok + 1; r := r || E'OK  4.2 Sininho: filho recebeu aviso das 4 tarefas novas\n'; else nfalha := nfalha + 1; r := r || 'FALHA 4.2 avisos=' || n || E'\n'; end if;
  select count(*) into n from public.ra_ocorrencias where membro_id <> F1;
  if n = 0 then nok := nok + 1; r := r || E'OK  4.3 Filho não vê tarefas do irmão\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.3 filho viu tarefas do irmão\n'; end if;
  select count(*) into n from public.ra_tarefas where id = tS;
  if n = 0 then nok := nok + 1; r := r || E'OK  4.4 Filho não vê a tarefa do irmão nem pelo cadastro\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.4\n'; end if;
  select id into oc from public.ra_ocorrencias where tarefa_id = tP;
  begin perform public.ra_concluir(oc, null); nfalha := nfalha + 1; r := r || E'FALHA 4.5 concluiu sem foto obrigatória\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.5 Tarefa com foto obrigatória recusa conclusão sem foto\n'; end;
  begin perform public.ra_concluir(oc, F2::text || '/' || F2::text || '/x.jpg'); nfalha := nfalha + 1; r := r || E'FALHA 4.6 aceitou foto de outra pasta\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.6 Recusa foto de pasta de outra pessoa\n'; end;
  begin perform public.ra_concluir2(oc, fam::text || '/' || F1::text || '/velha.jpg', now() - interval '2 days'); nfalha := nfalha + 1; r := r || E'FALHA 4.6b aceitou foto antiga\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.6b Recusa foto que não é de hoje (tirada há 2 dias)\n'; end;
  begin perform public.ra_concluir(oc, fam::text || '/' || F1::text || '/semdata.jpg'); nfalha := nfalha + 1; r := r || E'FALHA 4.6c aceitou foto sem data\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.6c Recusa foto sem a data de quando foi tirada\n'; end;
  begin perform public.ra_concluir2(oc, fam::text || '/' || F1::text || '/futura.jpg', now() + interval '3 hours'); nfalha := nfalha + 1; r := r || E'FALHA 4.6d aceitou foto do futuro\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.6d Recusa foto com data no futuro\n'; end;
  begin perform public.ra_meu_avatar('fam/outro/x.jpg'); nfalha := nfalha + 1; r := r || E'FALHA 4.6e avatar de pasta alheia\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.6e Recusa avatar de pasta alheia\n'; end;
  perform public.ra_meu_avatar('preset:d2');
  select avatar into t from public.ra_membros where id = F1;
  if t = 'preset:d2' then nok := nok + 1; r := r || E'OK  4.6f Filho escolhe um avatar pronto\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.6f avatar pronto\n'; end if;
  perform public.ra_concluir2(oc, fam::text || '/' || F1::text || '/foto.jpg', now() - interval '10 minutes');
  select status into t from public.ra_ocorrencias where id = oc;
  select foto_tirada_em is not null into b from public.ra_ocorrencias where id = oc;
  if t = 'cumprida' and b then nok := nok + 1; r := r || E'OK  4.7 Filho conclui com foto tirada agora (horário da foto fica registrado)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.7\n'; end if;
  select id into oc2 from public.ra_ocorrencias where tarefa_id = tM limit 1;
  perform public.ra_concluir2(oc2, null, null);
  execute 'reset role';
  select count(*) into n from public.ra_notificacoes where para_membro = G and titulo = 'Filho1 concluiu: Arrumar quarto (com foto)';
  if n = 1 then nok := nok + 1; r := r || E'OK  4.7b Pai recebe aviso da tarefa concluída com foto\n'; else nfalha := nfalha + 1; r := r || 'FALHA 4.7b avisos=' || n || E'\n'; end if;
  select count(*) into n from public.ra_notificacoes where para_membro = G and titulo like 'Filho1 concluiu: Pagar conta%';
  if n = 0 then nok := nok + 1; r := r || E'OK  4.7c Pai que pediu "só com foto" não recebe conclusão sem foto\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.7c\n'; end if;
  select count(*) into n from public.ra_notificacoes where para_membro = G2 and titulo like 'Filho1 concluiu%';
  if n = 0 then nok := nok + 1; r := r || E'OK  4.7d Mãe que desligou avisos de conclusão não recebe nenhum\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.7d\n'; end if;
  execute 'set local role authenticated';
  perform public.ra_desfazer(oc);
  select status into t from public.ra_ocorrencias where id = oc;
  if t = 'pendente' then nok := nok + 1; r := r || E'OK  4.8 Filho desfaz a conclusão\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.8\n'; end if;
  perform public.ra_concluir2(oc, fam::text || '/' || F1::text || '/foto.jpg', now());
  begin perform public.ra_definir_horario(oc, '10:00', '11:00'); nfalha := nfalha + 1; r := r || E'FALHA 4.9 filho mudou horário definido pelos pais\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.9 Filho não muda horário que os pais definiram\n'; end;
  select id into oc2 from public.ra_ocorrencias where tarefa_id = tD and data = d0 - 2;
  perform public.ra_justificar(oc2, 'Estava doente');
  select justificativa_status into t from public.ra_ocorrencias where id = oc2;
  if t = 'pendente' then nok := nok + 1; r := r || E'OK  4.10 Filho justifica tarefa atrasada\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.10\n'; end if;
  select id into oc2 from public.ra_ocorrencias where tarefa_id = tD and data = d0 - 1;
  begin perform public.ra_pedir_adiamento(oc2, d0 - 1, null, 'teste'); nfalha := nfalha + 1; r := r || E'FALHA 4.11 aceitou adiar para o passado\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.11 Adiamento para data passada é recusado\n'; end;
  perform public.ra_pedir_adiamento(oc2, d0 + 10, '15:00', 'Prova na escola');
  select status into t from public.ra_ocorrencias where id = oc2;
  if t = 'adiamento_pedido' then nok := nok + 1; r := r || E'OK  4.12 Filho pede adiamento\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.12\n'; end if;
  select id into oc2 from public.ra_ocorrencias where tarefa_id = tM limit 1;
  begin perform public.ra_pedir_adiamento(oc2, d0 + 20, null, 'quero adiar'); nfalha := nfalha + 1; r := r || E'FALHA 4.12b adiou tarefa que não pode ser adiada\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.12b Tarefa com "pode adiar" desligado recusa pedido de adiamento\n'; end;
  select id into oc2 from public.ra_ocorrencias where tarefa_id = tL;
  begin perform public.ra_concluir2(oc2, null, null); nfalha := nfalha + 1; r := r || E'FALHA 4.12c concluiu atrasada sem justificar\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.12c Tarefa atrasada que exige justificativa não conclui sem justificar\n'; end;
  perform public.ra_justificar(oc2, 'Esqueci o caderno na escola');
  perform public.ra_concluir2(oc2, null, null);
  select status into t from public.ra_ocorrencias where id = oc2;
  if t = 'cumprida' then nok := nok + 1; r := r || E'OK  4.12d Depois de justificar, conclui normalmente\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.12d\n'; end if;
  begin
    insert into public.ra_tarefas(familia_id, titulo, responsavel_id, tipo, data_inicio, criada_por) values (fam, 'Hack', F2, 'pontual', d0, F1);
    nfalha := nfalha + 1; r := r || E'FALHA 4.13 filho criou tarefa para o irmão\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.13 Filho não cria tarefa para o irmão\n'; end;
  insert into public.ra_tarefas(familia_id, titulo, responsavel_id, tipo, data_inicio, hora_inicio, criada_por)
  values (fam, 'Treino de violão', F1, 'pontual', d0 + 1, '10:00', F1) returning id into tF;
  perform public.ra_gerar_ocorrencias(d0, d0 + 1);
  select id into oc2 from public.ra_ocorrencias where tarefa_id = tF;
  perform public.ra_definir_horario(oc2, '11:00', '12:00');
  select hora_inicio::text into t from public.ra_ocorrencias where id = oc2;
  if t = '11:00:00' then nok := nok + 1; r := r || E'OK  4.14 Filho cria a própria tarefa e ajusta o horário (agenda pessoal)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.14\n'; end if;
  update public.ra_tarefas set titulo = 'mudado' where id = tD; get diagnostics n = row_count;
  if n = 0 then nok := nok + 1; r := r || E'OK  4.15 Filho não edita tarefa criada pelos pais\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.15\n'; end if;
  delete from public.ra_tarefas where id = tD; get diagnostics n = row_count;
  if n = 0 then nok := nok + 1; r := r || E'OK  4.16 Filho não apaga tarefa dos pais\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.16\n'; end if;
  update public.ra_ocorrencias set status = 'cumprida' where tarefa_id = tD; get diagnostics n = row_count;
  if n = 0 then nok := nok + 1; r := r || E'OK  4.17 Filho não marca tarefa como feita "por fora" do app\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.17\n'; end if;
  update public.ra_membros set papel = 'gestor' where id = F1; get diagnostics n = row_count;
  if n = 0 then nok := nok + 1; r := r || E'OK  4.18 Filho não vira gestor sozinho\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.18\n'; end if;
  begin perform public.ra_responder_adiamento(gen_random_uuid(), true, null); nfalha := nfalha + 1; r := r || E'FALHA 4.19\n';
  exception when others then nok := nok + 1; r := r || E'OK  4.19 Filho não aprova adiamento\n'; end;
  select count(*) into n from public.ra_historico;
  if n = 0 then nok := nok + 1; r := r || E'OK  4.20 Filho não vê histórico de auditoria\n'; else nfalha := nfalha + 1; r := r || E'FALHA 4.20\n'; end if;

  -- ===== 5. Pai responde =====
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'teste-pai@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.ra_notificacoes where titulo like 'Filho1%';
  if n >= 3 then nok := nok + 1; r := r || E'OK  5.1 Pai recebeu avisos (justificativa, adiamento, tarefa criada pelo filho)\n'; else nfalha := nfalha + 1; r := r || 'FALHA 5.1 avisos=' || n || E'\n'; end if;
  select id into adi from public.ra_adiamentos where status = 'pendente';
  perform public.ra_responder_adiamento(adi, true, 'Ok, boa prova');
  select count(*) into n from public.ra_ocorrencias where tarefa_id = tD and data = d0 + 10 and status = 'pendente';
  select status into t from public.ra_ocorrencias where tarefa_id = tD and data = d0 - 1;
  if n = 1 and t = 'adiada' then nok := nok + 1; r := r || E'OK  5.2 Pai aprova adiamento: tarefa vai para a nova data\n'; else nfalha := nfalha + 1; r := r || E'FALHA 5.2\n'; end if;
  select id into oc2 from public.ra_ocorrencias where tarefa_id = tD and data = d0 - 2;
  perform public.ra_avaliar_justificativa(oc2, true);
  select justificativa_status into t from public.ra_ocorrencias where id = oc2;
  if t = 'aceita' then nok := nok + 1; r := r || E'OK  5.3 Pai aceita justificativa\n'; else nfalha := nfalha + 1; r := r || E'FALHA 5.3\n'; end if;
  perform public.ra_conferir(oc, 'refazer');
  select status into t from public.ra_ocorrencias where id = oc;
  if t = 'pendente' then nok := nok + 1; r := r || E'OK  5.4 Pai pede para refazer: tarefa volta a pendente\n'; else nfalha := nfalha + 1; r := r || E'FALHA 5.4\n'; end if;
  update public.ra_ocorrencias set status = 'cumprida', concluida_em = now() where id = oc;
  perform public.ra_conferir(oc, 'conferido');
  select conferido into t from public.ra_ocorrencias where id = oc;
  if t = 'conferido' then nok := nok + 1; r := r || E'OK  5.5 Pai marca como conferida\n'; else nfalha := nfalha + 1; r := r || E'FALHA 5.5\n'; end if;
  select count(*) into n from public.ra_historico;
  if n > 5 then nok := nok + 1; r := r || 'OK  5.6 Histórico registra as ações (' || n || E' registros)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 5.6\n'; end if;
  -- relatório: o que o painel/relatório consulta
  select count(*) into n from (select o.status from public.ra_ocorrencias o join public.ra_tarefas tt on tt.id = o.tarefa_id left join public.ra_categorias c on c.id = tt.categoria_id where o.data between d0 - 3 and d0 + 7) q;
  if n > 0 then nok := nok + 1; r := r || 'OK  5.7 Consulta do relatório/painel traz ' || n || E' itens no período\n'; else nfalha := nfalha + 1; r := r || E'FALHA 5.7\n'; end if;

  -- ===== 6. Tempo de tela =====
  insert into public.ra_tela_previsto(familia_id, membro_id, formato, dias_semana, vigencia_inicio, fixado, min_celular, min_computador, criado_por)
  values (fam, F1, 'aparelho', '{0,1,2,3,4,5,6}', d0 - 7, true, 120, 60, G);
  select min_total into n from public.ra_tela_previsto_dia(F1, d0);
  if n = 180 then nok := nok + 1; r := r || E'OK  6.1 Pai define previsto por aparelho fixo (2h celular + 1h computador = 3h)\n'; else nfalha := nfalha + 1; r := r || 'FALHA 6.1 total=' || coalesce(n::text,'nulo') || E'\n'; end if;
  insert into public.ra_tela_previsto(familia_id, membro_id, formato, dias_semana, vigencia_inicio, vigencia_fim, min_total, criado_por)
  values (fam, F1, 'total', array[extract(dow from d0 + 2)::int], d0 + 2, d0 + 2, 240, G);
  select min_total into n from public.ra_tela_previsto_dia(F1, d0 + 2);
  if n = 240 then nok := nok + 1; r := r || E'OK  6.2 Previsto de um dia específico (só total) vale sobre o fixo\n'; else nfalha := nfalha + 1; r := r || E'FALHA 6.2\n'; end if;

  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', f1U, 'email', 'teste-f1@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.ra_notificacoes where titulo like 'Adiamento aprovado%' or titulo like 'Refazer%';
  if n = 2 then nok := nok + 1; r := r || E'OK  6.3 Filho recebeu aviso de adiamento aprovado e de refazer\n'; else nfalha := nfalha + 1; r := r || 'FALHA 6.3 avisos=' || n || E'\n'; end if;
  begin
    insert into public.ra_tela_previsto(familia_id, membro_id, formato, dias_semana, vigencia_inicio, min_total, criado_por) values (fam, F1, 'total', '{1}', d0, 999, F1);
    nfalha := nfalha + 1; r := r || E'FALHA 6.4 filho alterou o próprio previsto\n';
  exception when others then nok := nok + 1; r := r || E'OK  6.4 Filho não altera o previsto diretamente\n'; end;
  perform public.ra_propor_tela(d0 + 1, 120, 180, null, 'Trabalho da faculdade');
  nok := nok + 1; r := r || E'OK  6.5 Filho propõe outro previsto\n';
  insert into public.ra_tela_real(familia_id, membro_id, data, min_celular, min_computador, min_total, foto_celular)
  values (fam, F1, d0 - 1, 185, 65, 250, fam::text || '/' || F1::text || '/uso.jpg');
  update public.ra_tela_real set min_celular = 190, min_total = 255 where membro_id = F1 and data = d0 - 1; get diagnostics n = row_count;
  if n = 1 then nok := nok + 1; r := r || E'OK  6.6 Filho lança e corrige o realizado de ontem (com foto)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 6.6\n'; end if;
  insert into public.ra_tela_real(familia_id, membro_id, data, min_total) values (fam, F1, d0 - 5, 100);
  begin update public.ra_tela_real set min_total = 10 where membro_id = F1 and data = d0 - 5;
    nfalha := nfalha + 1; r := r || E'FALHA 6.7 filho alterou realizado antigo\n';
  exception when others then nok := nok + 1; r := r || E'OK  6.7 Filho não altera realizado de dias antigos\n'; end;
  begin insert into public.ra_tela_real(familia_id, membro_id, data, min_total) values (fam, F2, d0 - 1, 1);
    nfalha := nfalha + 1; r := r || E'FALHA 6.8\n';
  exception when others then nok := nok + 1; r := r || E'OK  6.8 Filho não lança tempo de tela do irmão\n'; end;
  update public.ra_notificacoes set lida = true where lida = false; get diagnostics n = row_count;
  if n >= 3 then nok := nok + 1; r := r || E'OK  6.9 Filho marca avisos como lidos\n'; else nfalha := nfalha + 1; r := r || E'FALHA 6.9\n'; end if;

  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'teste-pai@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select id into prop from public.ra_tela_proposta where status = 'pendente';
  perform public.ra_responder_tela(prop, true);
  select min_computador into n from public.ra_tela_previsto_dia(F1, d0 + 1);
  if n = 180 then nok := nok + 1; r := r || E'OK  6.10 Pai valida a proposta: previsto do dia muda para 3h no computador\n'; else nfalha := nfalha + 1; r := r || E'FALHA 6.10\n'; end if;
  update public.ra_tela_real set min_total = 10 where membro_id = F1 and data = d0 - 5; get diagnostics n = row_count;
  if n = 1 then nok := nok + 1; r := r || E'OK  6.11 Pai corrige realizado antigo\n'; else nfalha := nfalha + 1; r := r || E'FALHA 6.11\n'; end if;
  select count(*) into n from public.ra_notificacoes where lida = false and titulo like '%propôs%';
  if n = 1 then nok := nok + 1; r := r || E'OK  6.12 Pai recebeu aviso da proposta de tela\n'; else nfalha := nfalha + 1; r := r || E'FALHA 6.12\n'; end if;
  -- excluir tarefa (o app desativa e cancela as futuras)
  update public.ra_tarefas set ativa = false where id = tD;
  update public.ra_ocorrencias set status = 'cancelada' where tarefa_id = tD and status = 'pendente' and data >= d0; get diagnostics n = row_count;
  if n >= 7 then nok := nok + 1; r := r || E'OK  6.13 Pai exclui tarefa: futuras canceladas, passado mantido\n'; else nfalha := nfalha + 1; r := r || 'FALHA 6.13 canceladas=' || n || E'\n'; end if;

  -- ===== 7. Filho 2 e estranhos =====
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', f2U, 'email', 'teste-f2@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform public.ra_vincular();
  select count(*) into n from public.ra_tela_real;
  if n = 0 then nok := nok + 1; r := r || E'OK  7.1 Filho2 não vê tempo de tela do irmão\n'; else nfalha := nfalha + 1; r := r || E'FALHA 7.1\n'; end if;
  select count(*) into n from public.ra_notificacoes;
  if n = 1 then nok := nok + 1; r := r || E'OK  7.2 Filho2 vê só os próprios avisos\n'; else nfalha := nfalha + 1; r := r || 'FALHA 7.2 avisos=' || n || E'\n'; end if;

  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', xU, 'email', 'teste-estranho@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  m := public.ra_vincular();
  select count(*) into n from public.ra_membros;
  if m.id is null and n = 0 then nok := nok + 1; r := r || E'OK  7.3 Pessoa não convidada entra no Google mas não vê nada\n'; else nfalha := nfalha + 1; r := r || E'FALHA 7.3\n'; end if;
  begin perform public.ra_concluir(oc, null); nfalha := nfalha + 1; r := r || E'FALHA 7.4\n';
  exception when others then nok := nok + 1; r := r || E'OK  7.4 Não convidado não consegue concluir tarefa de ninguém\n'; end;

  fam2 := public.ra_criar_familia('Família do Estranho', 'Estranho');
  select count(*) into n from public.ra_categorias where familia_id = fam2;
  if public.ra_sou_gestor() and public.ra_minha_familia() = fam2 and n >= 11 then nok := nok + 1; r := r || E'OK  7.4b Pessoa nova cria a própria família, vira pai/mãe e já ganha as 11 categorias\n'; else nfalha := nfalha + 1; r := r || 'FALHA 7.4b categorias=' || n || E'\n'; end if;
  select count(*) into n from public.ra_membros;
  if n = 1 then nok := nok + 1; r := r || E'OK  7.4c Família nova não enxerga nenhuma outra família\n'; else nfalha := nfalha + 1; r := r || 'FALHA 7.4c membros=' || n || E'\n'; end if;
  begin perform public.ra_criar_familia('Outra', 'Estranho'); nfalha := nfalha + 1; r := r || E'FALHA 7.4d criou segunda família\n';
  exception when others then nok := nok + 1; r := r || E'OK  7.4d Mesma pessoa não cria uma segunda família\n'; end;

  -- administrador geral (super admin)
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'email', 'sakaiadm2@gmail.com', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.ra_admin_familias() a where a.id in (fam, fam2);
  if n = 2 then nok := nok + 1; r := r || E'OK  7.7 Administrador geral vê todas as famílias com os números de uso\n'; else nfalha := nfalha + 1; r := r || 'FALHA 7.7 viu ' || n || E'\n'; end if;
  perform public.ra_admin_ativar_familia(fam, false);
  nok := nok + 1; r := r || E'OK  7.8 Administrador desativa uma família\n';
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', f2U, 'email', 'teste-f2@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.ra_membros;
  if public.ra_meu_id() is null and n = 0 then nok := nok + 1; r := r || E'OK  7.9 Família desativada perde o acesso (nada apagado)\n'; else nfalha := nfalha + 1; r := r || 'FALHA 7.9 membros=' || n || E'\n'; end if;

  execute 'reset role';
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
  begin select count(*) into n from public.ra_membros; nfalha := nfalha + 1; r := r || E'FALHA 7.5 visitante sem login leu membros\n';
  exception when others then nok := nok + 1; r := r || E'OK  7.5 Visitante sem login não lê nada\n'; end;
  begin perform public.ra_eu(); nfalha := nfalha + 1; r := r || E'FALHA 7.6\n';
  exception when others then nok := nok + 1; r := r || E'OK  7.6 Visitante sem login não chama funções\n'; end;
  execute 'reset role';


  -- ===== 8. Avisos no celular (push) =====
  execute 'reset role';
  update public.ra_familias set ativa = true where id = fam;   -- foi desativada no teste 7.8
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'teste-pai@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin perform public.ra_push_inscrever('http://inseguro.exemplo/x', 'a', 'b'); nfalha := nfalha + 1; r := r || E'FALHA 8.1 aceitou endereço sem https\n';
  exception when others then nok := nok + 1; r := r || E'OK  8.1 Recusa aparelho com endereço sem https\n'; end;
  perform public.ra_push_inscrever('https://push.exemplo/pai-1', 'chave-p256', 'chave-auth', 'Celular do pai');
  perform public.ra_push_inscrever('https://push.exemplo/pai-1', 'chave-p256-nova', 'chave-auth', 'Celular do pai');
  select count(*) into n from public.ra_push_inscricoes;
  if n = 1 then nok := nok + 1; r := r || E'OK  8.2 Pai cadastra o aparelho (cadastrar de novo não duplica)\n'; else nfalha := nfalha + 1; r := r || 'FALHA 8.2 aparelhos=' || n || E'\n'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', f1U, 'email', 'teste-f1@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.ra_push_inscricoes;
  if n = 0 then nok := nok + 1; r := r || E'OK  8.3 Filho não enxerga o aparelho do pai\n'; else nfalha := nfalha + 1; r := r || E'FALHA 8.3\n'; end if;
  begin perform public.ra_push_definir_segredo('segredo-de-teste-com-mais-de-24-letras'); nfalha := nfalha + 1; r := r || E'FALHA 8.4 usuário comum definiu o segredo\n';
  exception when others then nok := nok + 1; r := r || E'OK  8.4 Usuário comum não consegue definir o segredo do servidor\n'; end;
  begin perform * from public.ra_push_pendentes('qualquer-coisa'); nfalha := nfalha + 1; r := r || E'FALHA 8.5 leu a fila sem segredo\n';
  exception when others then nok := nok + 1; r := r || E'OK  8.5 Fila de avisos recusa quem não tem o segredo\n'; end;
  execute 'reset role';
  perform public.ra_push_definir_segredo('segredo-de-teste-com-mais-de-24-letras');
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'teste-pai@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform public.ra_push_teste();
  execute 'reset role';
  execute 'set local role anon';
  begin perform * from public.ra_push_pendentes('segredo-errado-segredo-errado-xx'); nfalha := nfalha + 1; r := r || E'FALHA 8.6 segredo errado aceito\n';
  exception when others then nok := nok + 1; r := r || E'OK  8.6 Segredo errado é recusado\n'; end;
  select count(*) into n from public.ra_push_pendentes('segredo-de-teste-com-mais-de-24-letras') p where p.endpoint = 'https://push.exemplo/pai-1' and p.titulo like 'Teste:%';
  if n = 1 then nok := nok + 1; r := r || E'OK  8.7 Servidor com o segredo certo recebe o aviso de teste para o aparelho do pai\n'; else nfalha := nfalha + 1; r := r || 'FALHA 8.7 pendentes=' || n || E'\n'; end if;
  select count(*) into n from public.ra_push_pendentes('segredo-de-teste-com-mais-de-24-letras') p where p.endpoint <> 'https://push.exemplo/pai-1';
  if n = 0 then nok := nok + 1; r := r || E'OK  8.8 Avisos de quem não tem aparelho não entram na fila\n'; else nfalha := nfalha + 1; r := r || E'FALHA 8.8\n'; end if;
  perform public.ra_push_concluir('segredo-de-teste-com-mais-de-24-letras', (select array_agg(p.notif_id) from public.ra_push_pendentes('segredo-de-teste-com-mais-de-24-letras') p), array['https://push.exemplo/morto']);
  select count(*) into n from public.ra_push_pendentes('segredo-de-teste-com-mais-de-24-letras');
  if n = 0 then nok := nok + 1; r := r || E'OK  8.9 Depois de enviado, o aviso sai da fila\n'; else nfalha := nfalha + 1; r := r || E'FALHA 8.9\n'; end if;
  perform public.ra_push_concluir('segredo-de-teste-com-mais-de-24-letras', null, array['https://push.exemplo/pai-1']);
  execute 'reset role';
  select count(*) into n from public.ra_push_inscricoes;
  if n = 0 then nok := nok + 1; r := r || E'OK  8.10 Aparelho que não existe mais (recusado pelo celular) é removido\n'; else nfalha := nfalha + 1; r := r || E'FALHA 8.10\n'; end if;


  -- ===== 9. Papéis, famílias e cadastros =====
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', gU, 'email', 'teste-pai@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.ra_categorias where familia_id = fam and nome = 'Trabalho/Estágio';
  if n = 0 then nok := nok + 1; r := r || E'OK  9.1 Categoria Trabalho/Estágio virou Trabalho\n'; else nfalha := nfalha + 1; r := r || E'FALHA 9.1\n'; end if;
  perform public.ra_editar_familia(fam, 'Família Nova', null, false);
  select count(*) into n from public.ra_familias where id = fam and nome = 'Família Nova';
  if n = 1 then nok := nok + 1; r := r || E'OK  9.2 Pai edita o nome da própria família\n'; else nfalha := nfalha + 1; r := r || E'FALHA 9.2\n'; end if;
  begin perform public.ra_editar_familia(fam, 'X', 'outra/pasta/a.jpg', true); nfalha := nfalha + 1; r := r || E'FALHA 9.3 aceitou imagem de outra pasta\n';
  exception when others then nok := nok + 1; r := r || E'OK  9.3 Imagem de outra pasta é recusada\n'; end;
  perform public.ra_definir_responsavel(fam, G, null, null);
  select count(*) into n from public.ra_familias where id = fam and responsavel_id = G;
  if n = 1 then nok := nok + 1; r := r || E'OK  9.4 Pai define o responsável da família\n'; else nfalha := nfalha + 1; r := r || E'FALHA 9.4\n'; end if;
  begin perform public.ra_definir_responsavel(fam, F1, null, null); nfalha := nfalha + 1; r := r || E'FALHA 9.5 filho virou responsável\n';
  exception when others then nok := nok + 1; r := r || E'OK  9.5 Só pai ou mãe pode ser responsável\n'; end;
  begin perform public.ra_definir_responsavel(fam, null, 'Novo', 'sem-arroba'); nfalha := nfalha + 1; r := r || E'FALHA 9.6 e-mail inválido aceito\n';
  exception when others then nok := nok + 1; r := r || E'OK  9.6 E-mail inválido é recusado ao trocar o responsável\n'; end;
  begin perform public.ra_excluir_membro(G); nfalha := nfalha + 1; r := r || E'FALHA 9.7 excluiu a si mesmo\n';
  exception when others then nok := nok + 1; r := r || E'OK  9.7 Ninguém exclui a si mesmo\n'; end;
  perform public.ra_excluir_membro(F2);
  select count(*) into n from public.ra_membros where id = F2;
  if n = 0 then nok := nok + 1; r := r || E'OK  9.8 Pai exclui uma pessoa da família\n'; else nfalha := nfalha + 1; r := r || E'FALHA 9.8\n'; end if;
  begin perform * from public.ra_admin_membros(fam); nfalha := nfalha + 1; r := r || E'FALHA 9.9 pai viu função do administrador\n';
  exception when others then nok := nok + 1; r := r || E'OK  9.9 Lista de pessoas de outras famílias é só do administrador geral\n'; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', f1U, 'email', 'teste-f1@teste.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin perform public.ra_excluir_membro(F1); nfalha := nfalha + 1; r := r || E'FALHA 9.10 filho excluiu pessoa\n';
  exception when others then nok := nok + 1; r := r || E'OK  9.10 Filho não exclui pessoas\n'; end;
  begin perform public.ra_editar_familia(fam, 'Hack', null, false); nfalha := nfalha + 1; r := r || E'FALHA 9.11 filho editou família\n';
  exception when others then nok := nok + 1; r := r || E'OK  9.11 Filho não edita a família\n'; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'email', 'sakaiadm2@gmail.com', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.ra_admin_membros(fam);
  if n >= 2 then nok := nok + 1; r := r || E'OK  9.12 Administrador geral lista as pessoas de qualquer família\n'; else nfalha := nfalha + 1; r := r || 'FALHA 9.12 n=' || n || E'\n'; end if;
  perform public.ra_editar_familia(fam2, 'Família do Admin', null, false);
  nok := nok + 1; r := r || E'OK  9.13 Administrador geral edita qualquer família\n';
  perform public.ra_definir_responsavel(fam, null, 'Responsável Novo', 'novo-resp@teste.local');
  execute 'reset role';
  select count(*) into n from public.ra_membros where familia_id = fam and email = 'novo-resp@teste.local' and papel = 'gestor';
  if n = 1 then nok := nok + 1; r := r || E'OK  9.14 Administrador troca o responsável por uma pessoa nova (entra como gestor)\n'; else nfalha := nfalha + 1; r := r || E'FALHA 9.14\n'; end if;
  execute 'reset role';

  execute 'reset role';
  begin update public.ra_membros set sexo = 'x' where id = G; nfalha := nfalha + 1; r := r || E'FALHA 9.15 sexo inválido aceito\n';
  exception when others then nok := nok + 1; r := r || E'OK  9.15 Sexo só aceita masculino ou feminino\n'; end;
  update public.ra_membros set sexo = 'f' where id = F1;
  nok := nok + 1; r := r || E'OK  9.16 Sexo feminino é gravado na pessoa\n';

  raise exception E'RELATORIO_TESTES\nAprovados: %  Falhas: %\n%', nok, nfalha, r;
end $$;
