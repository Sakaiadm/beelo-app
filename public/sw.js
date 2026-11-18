// Serviço de fundo do Rotina Ativa: recebe os avisos (push) e mostra no celular.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

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
