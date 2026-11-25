// @arquivo  origem.js: endereço público do app a partir do Host que o proxy envia.
// @tipo     regra
// @usado-por app/(app)/notificacoes/abrir/route.js, app/auth/callback/route.js, app/auth/confirm/route.js, app/auth/sair/route.js, middleware.js
// @cuidado  segurança: só aceita os endereços do próprio app; outro Host cai em APP_URL (evita link para site falso após o login).
// Endereço público do app. Atrás do nginx, request.url vem como http://0.0.0.0:3000,
// então montamos a partir do Host que o proxy envia.
// Segurança (varredura, item B5): só aceita os endereços do próprio app. Qualquer outro Host
// (ou o cabeçalho X-Forwarded-Host, que o nginx não limpa) cai no endereço principal (APP_URL),
// para ninguém montar um link que, depois do login, leve a um site falso.
export function origem(request) {
  const h = request.headers;
  const host = (h.get('host') || '').split(',')[0].trim().toLowerCase();
  const principal = (process.env.APP_URL || '').replace(/\/$/, '');
  const local = /^(localhost|127\.|0\.0\.0\.0)/.test(host);
  if (!host) return principal || new URL(request.url).origin;
  if (principal && !local) {
    const base = new URL(principal).host.toLowerCase();
    if (host !== base && host !== `www.${base}`) return principal;
  }
  const proto = (h.get('x-forwarded-proto') || (local ? 'http' : 'https')).split(',')[0].trim();
  return `${proto === 'http' && !local ? 'https' : proto}://${host}`;
}
