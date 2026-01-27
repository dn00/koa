/**
 * Service Worker for Home Smart Home
 * Task 014: Service Worker and Pack Caching
 *
 * Caching strategies:
 * - App shell: StaleWhileRevalidate (serve cached, update in background)
 * - Packs: CacheFirst (immutable by hash)
 * - Manifest: NetworkFirst (always try fresh, fallback to cache)
 */

const CACHE_NAME = 'hsh-cache-v1';
const APP_SHELL_CACHE = 'hsh-shell-v1';
const PACK_CACHE = 'hsh-packs-v1';

/**
 * App shell files to precache.
 */
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
];

/**
 * Install event - precache app shell.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_FILES).catch((err) => {
        console.warn('Failed to precache some app shell files:', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old versioned caches
            return (
              name.startsWith('hsh-') &&
              name !== APP_SHELL_CACHE &&
              name !== PACK_CACHE &&
              name !== CACHE_NAME
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

/**
 * Fetch event - handle requests with appropriate strategy.
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requests: NetworkFirst for manifests, skip caching for others
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.startsWith('/api/manifest/')) {
      event.respondWith(networkFirstStrategy(event.request));
    } else if (url.pathname.startsWith('/api/packs/')) {
      // Packs are cached in IndexedDB, not SW cache
      // Just pass through to network
      event.respondWith(fetch(event.request));
    } else {
      // Other API calls - network only
      event.respondWith(fetch(event.request));
    }
    return;
  }

  // App shell and static assets: StaleWhileRevalidate
  if (isAppShellRequest(url.pathname)) {
    event.respondWith(staleWhileRevalidateStrategy(event.request));
    return;
  }

  // Default: try network, fall back to cache
  event.respondWith(networkFirstStrategy(event.request));
});

/**
 * Check if request is for app shell.
 */
function isAppShellRequest(pathname) {
  return (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname.startsWith('/assets/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  );
}

/**
 * StaleWhileRevalidate strategy.
 * Serve from cache immediately, update cache in background.
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cachedResponse = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      // Network failed, we'll use cached version
      return null;
    });

  // Return cached version immediately, or wait for fetch
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Both cache and network failed
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

/**
 * NetworkFirst strategy.
 * Try network first, fall back to cache.
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Nothing available
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * CacheFirst strategy.
 * Try cache first, fall back to network.
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(PACK_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Pack not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Message handler for cache management.
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
    );
  }
});
