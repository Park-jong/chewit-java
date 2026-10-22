import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './pwa'

const register = vi.fn()

beforeEach(() => {
  register.mockReset().mockResolvedValue({})
  Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('registerServiceWorker', () => {
  it('production이 아니면 등록하지 않는다', () => {
    vi.stubEnv('PROD', false)

    registerServiceWorker()

    expect(register).not.toHaveBeenCalled()
  })

  it('production이면 /sw.js를 등록한다', () => {
    vi.stubEnv('PROD', true)

    registerServiceWorker()

    expect(register).toHaveBeenCalledWith('/sw.js')
  })

  it('등록이 실패해도 예외 없이 경고만 남긴다', async () => {
    vi.stubEnv('PROD', true)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    register.mockRejectedValue(new Error('boom'))

    expect(() => registerServiceWorker()).not.toThrow()

    await vi.waitFor(() => expect(warn).toHaveBeenCalled())
  })
})
