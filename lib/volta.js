// @arquivo  volta.js: para onde voltar depois de salvar (só caminhos do próprio app).
// @tipo     regra
// @usado-por app/(app)/tarefas/[id]/editar/page.js, app/(app)/tarefas/nova/page.js
// Para onde voltar depois de salvar ou ao tocar na setinha (Raio-X U22 e U23). Só caminhos do próprio app.
const VOLTAS = /^\/(hoje|painel|agenda)(\?[\w=&%.-]*)?$/;
export function lerVolta(sp) {
  const v = String(sp?.volta || '');
  if (VOLTAS.test(v)) return v;
  return /^\d{4}-\d{2}-\d{2}$/.test(sp?.d || '') ? sp.d : '';
}
export function hrefVolta(v) {
  if (v.startsWith('/')) return v;
  return v ? `/agenda?d=${v}` : '/agenda';
}
