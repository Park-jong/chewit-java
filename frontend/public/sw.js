/* chewit 서비스워커: 앱 셸/정적 자산만 캐시한다.
 *
 * 원칙
 * - /api/ 요청과 GET이 아닌 요청, 다른 출처 요청은 아예 가로채지 않는다(브라우저 기본 = 네트워크 전용).
 *   따라서 인증이 필요한 응답과 Authorization 헤더 요청은 캐시에 남지 않는다. 토큰(localStorage)도 건드리지 않는다.
 * - 네비게이션: 네트워크 우선, 오프라인이면 캐시된 index.html(SPA 셸)로 폴백.
 * - 정적 자산(/assets/, /icons/, favicon, manifest): 캐시 우선, 없으면 네트워크 후 저장.
 * - 캐시 이름을 올리면(CACHE_NAME) 활성화 시 'chewit-' 접두의 오래된 캐시를 모두 삭제한다.
 */
const CACHE_PREFIX = 'chewit-'
const CACHE_NAME = CACHE_PREFIX + 'shell-v1'
const SHELL_URL = '/index.html'
const PRECACHE_URLS = [SHELL_URL, '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png']
const STATIC_PREFIXES = ['/assets/', '/icons/']
const STATIC_PATHS = ['/favicon.svg', '/manifest.webmanifest']

function isApiPath(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/')
}

function isStaticPath(pathname) {
  return STATIC_PATHS.includes(pathname) || STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/** 'navigate' | 'static' | null. null이면 서비스워커가 관여하지 않는다. */
function classifyRequest(request, origin) {
  if (request.method !== 'GET') return null
  const url = new URL(request.url)
  if (url.origin !== origin || isApiPath(url.pathname)) return null
  if (request.mode === 'navigate') return 'navigate'
  return isStaticPath(url.pathname) ? 'static' : null
}

// 성공한 same-origin 기본 응답만 저장한다(리다이렉트·오류·opaque 제외).
function isCacheable(response) {
  return Boolean(response) && response.ok && response.type === 'basic'
}

async function handleNavigate(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    // SPA 라우트(/stats 등)도 같은 셸이므로 index.html 하나로 저장한다.
    if (isCacheable(response)) await cache.put(SHELL_URL, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(SHELL_URL)
    if (cached) return cached
    throw error
  }
}

async function handleStatic(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (isCacheable(response)) await cache.put(request, response.clone())
  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const kind = classifyRequest(event.request, self.location.origin)
  if (kind === 'navigate') event.respondWith(handleNavigate(event.request))
  else if (kind === 'static') event.respondWith(handleStatic(event.request))
})
