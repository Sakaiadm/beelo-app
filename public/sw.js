// Serviço de fundo do Rotina Ativa: recebe os avisos (push) e mostra no celular.
// Também faz o app abrir na hora pelo ícone: mostra a última versão guardada da tela inicial
// (Painel ou Hoje) enquanto busca a nova por trás. Assim a tela azul de abertura não fica
// esperando o banco responder (às vezes ele demora mais de 10 segundos).
// Sem internet: mostra a última cópia guardada da tela (com a faixa "Sem internet") ou, se não houver
// cópia, uma página própria em português no lugar da página de erro do navegador.
const TELAS = 'ra-telas-v1';
const ARQUIVOS = 'ra-arquivos-v1';
const OFFLINE = 'ra-offline-v5'; // trocar a versão sempre que mudar o offline.html
const PAGINA_OFFLINE = '/offline.html';
const INICIAIS = ['/painel', '/hoje'];
const NAO_GUARDAR = ['/login', '/auth', '/sem-acesso', '/notificacoes/abrir', '/privacidade', '/offline.html'];
const VALIDADE = 7 * 24 * 3600 * 1000; // cópia guardada vale no máximo 7 dias
const MAX_TELAS = 60;
const servidas = new Map(); // tela -> quando a cópia foi mostrada (evita mostrar a cópia duas vezes seguidas)

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(OFFLINE).then((c) => c.add(new Request(PAGINA_OFFLINE, { cache: 'reload' }))).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('ra-offline-') && k !== OFFLINE) await caches.delete(k);
  await self.clients.claim();
})()));

async function lerCookie(nome) {
  try { const c = await self.cookieStore.get(nome); return (c && c.value) || null; } catch { return null; }
}

// Arquivos do app (/_next/static) nunca mudam de conteúdo: guarda e reaproveita.
async function arquivo(req) {
  const cache = await caches.open(ARQUIVOS);
  const tem = await cache.match(req);
  if (tem) return tem;
  const r = await fetch(req);
  if (r.ok && r.type === 'basic') {
    cache.put(req, r.clone()).then(async () => {
      const chaves = await cache.keys();
      for (const k of chaves.slice(0, Math.max(0, chaves.length - 400))) await cache.delete(k);
    }).catch(() => {});
  }
  return r;
}

// Página própria "Sem internet" (guardada na instalação).
async function paginaOffline() {
  const r = await caches.match(PAGINA_OFFLINE).catch(() => null);
  if (r) return r;
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem internet</title><body style="font-family:system-ui;padding:40px 20px;color:#13203a;background:#f4f8fe"><h1>Sem internet</h1><p>Confira o Wi-Fi ou os dados móveis. Quando a internet voltar, toque em Tentar de novo.</p><button onclick="location.reload()">Tentar de novo</button>',
    { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// Entrega a cópia guardada avisando a página que ela é de antes (para mostrar a faixa e não tentar atualizar sem rede).
async function copiaSemRede(copia) {
  const quando = Number(copia.headers.get('x-ra-guardado') || 0);
  const html = (await copia.text()).replace(/<\/body>/i, `<script>self.__raCopia=${quando}</script></body>`);
  const h = new Headers(copia.headers);
  ['content-encoding', 'content-length', 'transfer-encoding'].forEach((k) => h.delete(k));
  h.set('content-type', 'text/html; charset=utf-8');
  return new Response(html, { status: 200, headers: h });
}

async function guardar(cache, chave, r) {
  const h = new Headers(r.headers);
  // O corpo guardado já vem descompactado: tira os cabeçalhos de compressão e tamanho para não confundir o navegador.
  ['content-encoding', 'content-length', 'transfer-encoding'].forEach((k) => h.delete(k));
  h.set('x-ra-guardado', String(Date.now()));
  await cache.put(chave, new Response(await r.blob(), { status: 200, headers: h }));
  const chaves = await cache.keys();
  for (const k of chaves.slice(0, Math.max(0, chaves.length - MAX_TELAS))) await cache.delete(k);
}

async function navegar(event, url) {
  const req = event.request;
  const quem = self.cookieStore ? await lerCookie('ra_u') : null;
  if (url.pathname === '/' && quem) {
    // Ícone do app: vai direto para a tela inicial desta pessoa, sem esperar o servidor.
    const inicio = await lerCookie('inicio');
    if (INICIAIS.includes(inicio)) return Response.redirect(new URL(inicio, url.origin).href, 302);
  }
  const guardavel = quem && !NAO_GUARDAR.some((p) => url.pathname.startsWith(p));
  if (!guardavel) {
    try { return await fetch(req); } catch { return paginaOffline(); }
  }
  const chave = new URL(`/__tela/${encodeURIComponent(quem)}${url.pathname}${url.search}`, url.origin).href;
  const cache = await caches.open(TELAS);
  const rede = fetch(req).then(async (r) => {
    const html = (r.headers.get('content-type') || '').includes('text/html');
    // Guarda por trás, sem atrasar a tela (ela continua chegando aos poucos, como sempre).
    if (r.status === 200 && r.type === 'basic' && !r.redirected && html) event.waitUntil(guardar(cache, chave, r.clone()).catch(() => {}));
    else if (r.status < 500) event.waitUntil(cache.delete(chave)); // saiu do login, mudou de papel etc.: não mostra mais a cópia
    return r;
  });
  const agora = Date.now();
  const valida = (c) => c && agora - Number(c.headers.get('x-ra-guardado') || 0) < VALIDADE;
  // Abrir pelo ícone (Painel ou Hoje): mostra a cópia na hora e atualiza por trás.
  // Só ao abrir normalmente (não ao recarregar), e não duas vezes seguidas.
  if (INICIAIS.includes(url.pathname) && !url.search && req.cache === 'default' && agora - (servidas.get(chave) || 0) > 15000) {
    const copia = await cache.match(chave);
    if (valida(copia)) {
      servidas.set(chave, agora);
      event.waitUntil(rede.catch(() => {}));
      return self.navigator.onLine === false ? copiaSemRede(copia) : copia;
    }
  }
  try {
    const r = await rede;
    if (r.status >= 500) {
      // Servidor com problema: melhor a última cópia do que uma página de erro.
      const copia = await cache.match(chave);
      if (valida(copia)) return copiaSemRede(copia);
    }
    return r;
  } catch {
    const copia = await cache.match(chave);
    if (valida(copia)) return copiaSemRede(copia);
    return paginaOffline();
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/static/')) { event.respondWith(arquivo(req)); return; }
  // Qualquer imprevisto vira a página "Sem internet" em português, nunca a página de erro do navegador.
  if (req.mode === 'navigate') event.respondWith(navegar(event, url).catch(() => paginaOffline()));
});

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { corpo: event.data ? event.data.text() : '' }; }
  const titulo = d.titulo || 'Rotina Ativa';
  const tarefas = [
    self.registration.showNotification(titulo, {
      body: d.corpo || '',
      icon: '/icone-192.png',
      badge: '/icone-192.png',
      tag: d.tag || 'rotina-ativa',
      data: { url: d.url || '/notificacoes' },
    }),
  ];
  // número no ícone do app (quando instalado na tela inicial)
  if (typeof d.badge === 'number' && self.navigator && 'setAppBadge' in self.navigator) {
    tarefas.push((d.badge > 0 ? self.navigator.setAppBadge(d.badge) : self.navigator.clearAppBadge()).catch(() => {}));
  }
  event.waitUntil(Promise.all(tarefas));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/notificacoes', self.location.origin).href;
  event.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abertas) {
      if (new URL(c.url).origin === self.location.origin && 'focus' in c) {
        await c.focus();
        if ('navigate' in c) return c.navigate(url);
        return;
      }
    }
    return self.clients.openWindow(url);
  })());
});
