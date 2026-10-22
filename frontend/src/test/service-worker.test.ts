/// <reference types="node" />
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

// public/sw.js를 가짜 self/caches/fetch가 있는 샌드박스에서 실행해 동작을 검증한다.
const swSource = readFileSync(path.resolve(import.meta.dirname, '../../public/sw.js'), 'utf8')
const ORIGIN = 'https://chewit.test'

type FakeResponse = { ok: boolean; type: string; body: string; clone: () => FakeResponse }
type Handler = (event: unknown) => void
type Req = string | { url: string }

const response = (body: string, init: Partial<Pick<FakeResponse, 'ok' | 'type'>> = {}): FakeResponse => {
  const r: FakeResponse = { ok: true, type: 'basic', body, ...init, clone: () => r }
  return r
}

function setup() {
  const stores = new Map<string, Map<string, FakeResponse>>()
  const keyOf = (req: Req) => new URL(typeof req === 'string' ? req : req.url, ORIGIN).pathname
  const open = vi.fn(async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map())
    const store = stores.get(name)!
    return {
      match: async (req: Req) => store.get(keyOf(req)),
      put: async (req: Req, res: FakeResponse) => void store.set(keyOf(req), res),
      addAll: async (urls: string[]) => urls.forEach((u) => store.set(keyOf(u), response(`precached ${u}`))),
    }
  })
  const fetchMock = vi.fn<(req: unknown) => Promise<FakeResponse>>()
  const handlers: Record<string, Handler> = {}
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, h: Handler) => (handlers[type] = h),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  }
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  }
  vm.runInNewContext(swSource, { self, caches, fetch: fetchMock, URL, Promise })

  const dispatchFetch = (url: string, init: { method?: string; mode?: string } = {}) => {
    const respondWith = vi.fn()
    handlers.fetch({ request: { url, method: init.method ?? 'GET', mode: init.mode ?? 'cors' }, respondWith })
    return respondWith
  }
  const lifecycle = async (type: 'install' | 'activate') => {
    let pending: Promise<unknown> = Promise.resolve()
    handlers[type]({ waitUntil: (p: Promise<unknown>) => (pending = p) })
    await pending
  }
  return { stores, fetchMock, self, caches, dispatchFetch, lifecycle }
}

let sw: ReturnType<typeof setup>

beforeEach(() => {
  sw = setup()
})

describe('service worker 요청 분류', () => {
  it('/api/ 요청은 메서드·모드와 상관없이 가로채지 않고 아무것도 캐시하지 않는다', () => {
    const respondWiths = [
      sw.dispatchFetch(`${ORIGIN}/api/tasks?date=2026-10-22`),
      sw.dispatchFetch(`${ORIGIN}/api/export?format=csv`),
      sw.dispatchFetch(`${ORIGIN}/api/auth/login`, { method: 'POST' }),
      sw.dispatchFetch(`${ORIGIN}/api/tasks`, { mode: 'navigate' }),
    ]

    respondWiths.forEach((r) => expect(r).not.toHaveBeenCalled())
    expect(sw.caches.open).not.toHaveBeenCalled()
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })

  it('다른 출처, GET이 아닌 요청, 목록 밖 경로는 가로채지 않는다', () => {
    expect(sw.dispatchFetch('https://cdn.example.com/assets/a.js')).not.toHaveBeenCalled()
    expect(sw.dispatchFetch(`${ORIGIN}/assets/a.js`, { method: 'POST' })).not.toHaveBeenCalled()
    expect(sw.dispatchFetch(`${ORIGIN}/something.json`)).not.toHaveBeenCalled()
  })
})

describe('service worker 캐시 전략', () => {
  it('네비게이션은 네트워크 응답을 돌려주고 index.html로 저장한다', async () => {
    const fresh = response('fresh shell')
    sw.fetchMock.mockResolvedValue(fresh)

    const respondWith = sw.dispatchFetch(`${ORIGIN}/stats`, { mode: 'navigate' })

    await expect(respondWith.mock.calls[0][0]).resolves.toBe(fresh)
    expect(sw.stores.get('chewit-shell-v1')?.get('/index.html')).toBe(fresh)
  })

  it('오프라인 네비게이션은 캐시된 index.html로 폴백한다', async () => {
    const shell = response('cached shell')
    sw.stores.set('chewit-shell-v1', new Map([['/index.html', shell]]))
    sw.fetchMock.mockRejectedValue(new TypeError('offline'))

    const respondWith = sw.dispatchFetch(`${ORIGIN}/checklists`, { mode: 'navigate' })

    await expect(respondWith.mock.calls[0][0]).resolves.toBe(shell)
  })

  it('정적 자산은 캐시에 있으면 네트워크를 쓰지 않는다', async () => {
    const cached = response('cached js')
    sw.stores.set('chewit-shell-v1', new Map([['/assets/app-1.js', cached]]))

    const respondWith = sw.dispatchFetch(`${ORIGIN}/assets/app-1.js`)

    await expect(respondWith.mock.calls[0][0]).resolves.toBe(cached)
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })

  it('정적 자산은 정상 응답만 저장하고 오류·opaque 응답은 저장하지 않는다', async () => {
    const ok = response('js')
    const notFound = response('nf', { ok: false })
    const opaque = response('op', { type: 'opaque' })
    sw.fetchMock.mockResolvedValueOnce(ok).mockResolvedValueOnce(notFound).mockResolvedValueOnce(opaque)

    for (const file of ['a.js', 'b.js', 'c.js']) {
      await sw.dispatchFetch(`${ORIGIN}/assets/${file}`).mock.calls[0][0]
    }

    const store = sw.stores.get('chewit-shell-v1')!
    expect([...store.keys()]).toEqual(['/assets/a.js'])
  })
})

describe('service worker 생명주기', () => {
  it('install은 앱 셸을 미리 캐시하고 skipWaiting한다', async () => {
    await sw.lifecycle('install')

    expect([...sw.stores.get('chewit-shell-v1')!.keys()]).toContain('/index.html')
    expect(sw.self.skipWaiting).toHaveBeenCalled()
  })

  it('activate는 오래된 chewit- 캐시만 삭제하고 현재 캐시와 남의 캐시는 유지한다', async () => {
    sw.stores.set('chewit-shell-v0', new Map())
    sw.stores.set('chewit-shell-v1', new Map())
    sw.stores.set('other-app', new Map())

    await sw.lifecycle('activate')

    expect([...sw.stores.keys()].sort()).toEqual(['chewit-shell-v1', 'other-app'])
    expect(sw.self.clients.claim).toHaveBeenCalled()
  })
})
