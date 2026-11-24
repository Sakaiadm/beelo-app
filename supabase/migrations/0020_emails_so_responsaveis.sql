-- beelo 0020 (parte 2 da varredura): rodar SÓ DEPOIS de o app novo estar no ar (comando da VPS).
-- Pode rodar mais de uma vez.
-- B4) O e-mail das pessoas sai da leitura comum: só Pai e Mãe recebem, pela função ra_emails_grupo.
-- B3) Pai e Mãe só alteram os campos de cadastro (não a conta ligada, o grupo, o id nem os registros de aceite).
revoke select, insert, update on public.ra_membros from authenticated;
grant select (id, familia_id, user_id, nome, papel, cor, ativo, tela_ativo, termos_aceitos_em, termos_versao, criado_em, avatar, notif,
  funcao, permissoes, sexo, convidado_em, modo_crianca, premios_ate8, cofrinho_meta, autorizado_em, autorizado_por, autorizado_versao)
  on public.ra_membros to authenticated;
grant insert (familia_id, nome, email, papel, funcao, permissoes, ativo, modo_crianca, cor, sexo, avatar, tela_ativo)
  on public.ra_membros to authenticated;
grant update (nome, email, papel, funcao, permissoes, ativo, modo_crianca, cor, sexo, avatar, tela_ativo, convidado_em, premios_ate8, notif)
  on public.ra_membros to authenticated;
