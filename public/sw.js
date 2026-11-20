// Serviço de fundo do Rotina Ativa: recebe os avisos (push) e mostra no celular.
// Também faz o app abrir na hora pelo ícone: mostra a última versão guardada da tela inicial
// (Painel ou Hoje) enquanto busca a nova por trás. Assim a tela azul de abertura não fica
// esperando o banco responder (às vezes ele demora mais de 10 segundos).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const TELAS = 'ra-telas-v1';
const ARQUIVOS = 'ra-arquivos-v1';
const INICIAIS = ['/painel', '/hoje'];
const VALIDADE = 7 * 24 * 3600 * 1000; // cópia guardada vale no máximo 7 dias
const servidas = new Map(); // tela -> quando a cópia foi mostrada (evita mostrar a cópia duas vezes seguidas)

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

async function abrir(event, url) {
  const req = event.request;
  const quem = await lerCookie('ra_u');
  if (url.pathname === '/') {
    // Ícone do app: vai direto para a tela inicial desta pessoa, sem esperar o servidor.
    const inicio = await lerCookie('inicio');
    if (quem && INICIAIS.includes(inicio)) return Response.redirect(new URL(inicio, url.origin).href, 302);
    return fetch(req);
  }
  if (!quem) return fetch(req);
  const chave = new URL(`/__tela/${encodeURIComponent(quem)}${url.pathname}`, url.origin).href;
  const cache = await caches.open(TELAS);
  const rede = fetch(req).then(async (r) => {
    const html = (r.headers.get('content-type') || '').includes('text/html');
    if (r.status === 200 && r.type === 'basic' && !r.redirected && html) {
      const h = new Headers(r.headers);
      h.set('x-ra-guardado', String(Date.now()));
      await cache.put(chave, new Response(await r.clone().blob(), { status: 200, headers: h }));
    } else {
      await cache.delete(chave); // saiu do login, mudou de papel etc.: não mostra mais a cópia
    }
    return r;
  });
  const agora = Date.now();
  // Só usa a cópia ao abrir normalmente (não ao recarregar), e não duas vezes seguidas.
  if (req.cache === 'default' && agora - (servidas.get(chave) || 0) > 15000) {
    const copia = await cache.match(chave);
    if (copia && agora - Number(copia.headers.get('x-ra-guardado') || 0) < VALIDADE) {
      servidas.set(chave, agora);
      event.waitUntil(rede.catch(() => {}));
      return copia;
    }
  }
  return rede;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/static/')) { event.respondWith(arquivo(req)); return; }
  if (req.mode !== 'navigate' || url.search || !self.cookieStore) return;
  if (url.pathname === '/' || INICIAIS.includes(url.pathname)) event.respondWith(abrir(event, url));
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
