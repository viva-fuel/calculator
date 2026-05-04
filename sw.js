/**
 * Viva Aerobus · Fuel Loading Calculator
 * Service Worker para soporte offline.
 *
 * Estrategia:
 *  - HTML / navegación → network-first con fallback a cache (siempre tratamos
 *    de traer la última versión, pero si no hay red usamos la cacheada).
 *  - Fonts y assets externos → stale-while-revalidate (devolvemos cache rápido
 *    y refrescamos en background).
 *  - Webhook de SharePoint (cualquier POST a logic.azure.com) → SIEMPRE network,
 *    nunca cache. Si falla, dejamos que el frontend lo encole en localStorage.
 *
 * Bumpá CACHE_VERSION cada vez que cambies el HTML para forzar la actualización
 * en dispositivos que ya tienen la SW vieja instalada.
 */

const CACHE_VERSION = 'viva-fuel-v3';
const SHELL_CACHE   = CACHE_VERSION + '-shell';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

const SHELL_URLS = [
  './',
  './index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isHtmlRequest(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function isWebhookRequest(url) {
  return /logic\.azure\.com|powerautomate\.com|microsoft\.com/i.test(url.hostname);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Nunca tocar el webhook de SharePoint/Power Automate.
  if (isWebhookRequest(url) || request.method !== 'GET') {
    return;
  }

  if (isHtmlRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(request) || await cache.match('./index.html') || await cache.match('./');
    if (cached) return cached;
    throw e;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetching = fetch(request).then((response) => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetching;
}
