// Endereço público do app. Atrás do nginx, request.url vem como http://0.0.0.0:3000,
// então montamos a partir dos cabeçalhos que o proxy envia (Host e X-Forwarded-Proto).
export function origem(request) {
  const h = request.headers;
  const host = (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim();
  if (!host) return new URL(request.url).origin;
  const local = /^(localhost|127\.|0\.0\.0\.0)/.test(host);
  const proto = (h.get('x-forwarded-proto') || (local ? 'http' : 'https')).split(',')[0].trim();
  return `${proto}://${host}`;
}
