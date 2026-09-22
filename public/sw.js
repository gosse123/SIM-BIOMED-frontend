const STATIC_CACHE = 'simbiomed-static-v4'
const API_CACHE = 'simbiomed-api-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Dev server: never intercept, always pass through
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return
  }

  // API calls: NEVER cache in Cache Storage (shared between users).
  // Return network response or 503 offline. Offline data lives in IndexedDB only.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request))
    return
  }

  // Production static assets: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
})

/**
 * Network-only for API calls. No Cache Storage to avoid cross-user data leakage.
 * Offline data is managed by IndexedDB in the app layer.
 */
async function networkOnly(request) {
  try {
    return await fetch(request)
  } catch {
    return new Response(
      JSON.stringify({ detail: 'Offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request)
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return cached || new Response('Offline', { status: 503 })
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
