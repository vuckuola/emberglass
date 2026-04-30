const CACHE_NAME = 'emberglass-v2'
const BASE_PATH = '/emberglass/'
const STATIC_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}favicon.svg`,
  `${BASE_PATH}icons.svg`,
]
const STATIC_EXTENSIONS = ['.js', '.css', '.svg', '.png', '.json', '.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) {
    return
  }

  if (request.mode === 'navigate' || url.pathname === BASE_PATH || url.pathname.endsWith('/index.html')) {
    event.respondWith(networkFirst(request))
    return
  }

  if (STATIC_EXTENSIONS.some((extension) => url.pathname.endsWith(extension))) {
    event.respondWith(cacheFirst(request))
  }
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
      await cache.put(`${BASE_PATH}index.html`, response.clone())
    }
    return response
  } catch {
    return (await cache.match(request)) || (await cache.match(`${BASE_PATH}index.html`))
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }

  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
  }
  return response
}
