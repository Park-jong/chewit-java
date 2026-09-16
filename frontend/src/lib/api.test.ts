import { describe, it, expect, beforeEach } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import { api, TOKEN_STORAGE_KEY } from './api'

async function captureRequestConfig(): Promise<InternalAxiosRequestConfig> {
  let captured: InternalAxiosRequestConfig | undefined
  await api.get('/probe', {
    adapter: async (config) => {
      captured = config
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    },
  })
  return captured!
}

describe('api 인터셉터', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('토큰이 있으면 Authorization 헤더를 붙인다', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'test-token')

    const config = await captureRequestConfig()

    expect(config.headers.Authorization).toBe('Bearer test-token')
  })

  it('토큰이 없으면 Authorization 헤더를 붙이지 않는다', async () => {
    const config = await captureRequestConfig()

    expect(config.headers.Authorization).toBeUndefined()
  })
})
