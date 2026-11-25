-- @migracao 0026: Desejos e pedidos de prêmio só da própria pessoa (e dos responsáveis).
-- @altera   regras de leitura (RLS) de ra_premios e ra_premio_pedidos. Nenhuma tabela ou coluna muda.
-- @rpc      não muda nenhuma função.
-- @decisao  Antes, qualquer pessoa do grupo conseguia ler, pela API, os desejos dos irmãos (nome, preço, resposta
--           dos pais, foto), porque a regra só conferia "é da mesma família". Agora:
--             ra_premios        → o catálogo do grupo (sem dono) OU o desejo da própria pessoa OU responsável.
--             ra_premio_pedidos → responsável, OU o pedido da própria pessoa, OU pedido do grupo todo (sem dono),
--                                 OU (só se o Mural estiver "A família toda vê") prêmio JÁ ENTREGUE de outra pessoa,
--                                 porque é isso que o Mural mostra como conquista. Pedido em aberto ou cancelado
--                                 de um irmão nunca aparece.
-- @regra    ra_cofrinho, ra_desafios e ra_desafio_periodos já estavam certos: o cofrinho é só da pessoa e dos
--           responsáveis; desafios e conquistas seguem a opção do Mural (ra_mural_todos). Não foram mexidos.
-- Seguro rodar de novo. O visual do app não muda.

drop policy if exists ra_pre_sel on public.ra_premios;
create policy ra_pre_sel on public.ra_premios for select using (
  familia_id = public.ra_minha_familia()
  and (public.ra_sou_gestor() or membro_id is null or membro_id = public.ra_meu_id()));

drop policy if exists ra_ped_sel on public.ra_premio_pedidos;
create policy ra_ped_sel on public.ra_premio_pedidos for select using (
  familia_id = public.ra_minha_familia()
  and (public.ra_sou_gestor() or membro_id is null or membro_id = public.ra_meu_id()
       or (status = 'entregue' and public.ra_mural_todos())));

notify pgrst, 'reload schema';
