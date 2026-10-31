// Service worker for the PWA share target. It only handles files shared into the installed app:
// the OS POSTs them to <scope>share-target, they are parked in the Cache, and the page is opened so it
// can upload them with the normal (signed-in) uploader. Everything else goes straight to the network.
const CACHE = 'immich-drop-share';
const TARGET = new URL('share-target', self.registration.scope).href;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method === 'POST' && request.url === TARGET) event.respondWith(receive(request));
});

async function receive(request) {
  const home = new URL(self.registration.scope);
  try {
    const form = await request.formData();
    const cache = await caches.open(CACHE);
    for (const key of await cache.keys()) await cache.delete(key); // leftovers of an earlier share
    let n = 0;
    for (const value of form.getAll('media')) {
      if (typeof value === 'string') continue;
      await cache.put(
        new URL(`file/${n++}`, self.registration.scope),
        new Response(value, {
          headers: {
            'Content-Type': value.type || 'application/octet-stream',
            'X-Name': encodeURIComponent(value.name || ''),
            'X-Last-Modified': String(value.lastModified || ''),
          },
        }),
      );
    }
    for (const k of ['title', 'text', 'url']) {
      const v = form.get(k);
      if (typeof v === 'string' && v) home.searchParams.set(k, v);
    }
    if (n) home.searchParams.set('shared-files', String(n));
  } catch {
    /* fall through to the home page */
  }
  return Response.redirect(home.href, 303);
}
