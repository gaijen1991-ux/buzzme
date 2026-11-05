// BuzzMe: service worker только для push-уведомлений (без кэширования).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) { d = { body: event.data && event.data.text() }; }
  const scope = self.registration.scope;
  event.waitUntil(self.registration.showNotification(d.title || 'BuzzYou', {
    body: d.body || fallbackBody(),
    icon: scope + 'icons/Icon-192.png',
    badge: scope + 'icons/Icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { chat_id: d.chat_id || null },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chat = event.notification.data && event.notification.data.chat_id;
  const url = self.registration.scope + (chat ? '?chat=' + encodeURIComponent(chat) : '');
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.startsWith(self.registration.scope)) {
        await c.focus();
        if (chat) c.postMessage({ type: 'open_chat', chat_id: chat });
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});

// Запасной текст, если сервер не прислал тело (язык браузера: ru / en / hy).
function fallbackBody() {
  const l = (self.navigator && self.navigator.language || 'ru').slice(0, 2);
  return l === 'en' ? 'New message' : l === 'hy' ? 'Նոր հաղորդագրություն' : 'Новое сообщение';
}
