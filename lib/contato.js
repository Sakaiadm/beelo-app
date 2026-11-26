// @arquivo  contato.js: contato e dados legais do beta (campos vazios aparecem como "a preencher").
// @tipo     regra
// @usado-por app/(app)/ajuda/page.js, app/acoes.js, app/login/page.js, app/sem-acesso/page.js, components/Legal.js, lib/aceite.js
// @cuidado  VERSAO_TERMOS: mudar a versão faz todos aceitarem de novo.
// Contato e dados legais da versão beta.
// Campos vazios aparecem nas páginas como "a preencher" (amarelo tracejado) até serem informados.
export const CONTATO = {
  responsavel: 'beelo',
  controlador: '',      // nome completo ou razão social de quem responde pelo beelo (preencher com o advogado)
  documento: '',        // CPF ou CNPJ (preencher com o advogado)
  encarregado: '',      // nome do encarregado de dados (DPO)
  email: 'contato@beeloapp.com',
  whatsapp: '(63) 98111-3466',
};
export const ATUALIZADO_EM = '24 de novembro de 2026';
// Versão dos Termos, da Privacidade e do Termo de consentimento. Mudou o texto de forma importante?
// Troque a data: todo mundo aceita de novo no próximo acesso.
export const VERSAO_TERMOS = '2026-11-24';
