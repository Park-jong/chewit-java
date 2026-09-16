import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './AuthContext'
import { TOKEN_STORAGE_KEY } from '@/lib/api'
import * as authApi from './api'
import type { UserResponse } from './types'

vi.mock('./api')

const mockedAuthApi = vi.mocked(authApi)

function renderUseAuth() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
  return renderHook(() => useAuth(), { wrapper })
}

const sampleUser: UserResponse = { id: 1, email: 'test@test.com', displayName: '닉네임' }

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  localStorage.clear()
})

describe('AuthContext', () => {
  it('토큰이 없으면 unauthenticated 상태다', () => {
    const { result } = renderUseAuth()

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
  })

  it('토큰이 있고 /me 조회에 성공하면 authenticated로 전환된다', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token')
    mockedAuthApi.fetchCurrentUser.mockResolvedValue(sampleUser)

    const { result } = renderUseAuth()

    await waitFor(() => expect(result.current.status).toBe('authenticated'))
    expect(result.current.user).toEqual(sampleUser)
  })

  it('토큰이 있지만 /me 조회에 실패하면 토큰을 지우고 unauthenticated가 된다', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'expired-token')
    mockedAuthApi.fetchCurrentUser.mockRejectedValue(new Error('만료된 토큰'))

    const { result } = renderUseAuth()

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('login 성공 시 토큰을 저장하고 authenticated로 전환된다', async () => {
    mockedAuthApi.login.mockResolvedValue({ token: 'new-token', user: sampleUser })
    // hasToken이 true로 바뀌며 /me 쿼리가 활성화돼 백그라운드로 재조회될 수 있으므로 동일한 값으로 응답하게 둔다.
    mockedAuthApi.fetchCurrentUser.mockResolvedValue(sampleUser)

    const { result } = renderUseAuth()
    expect(result.current.status).toBe('unauthenticated')

    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'password123' })
    })

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('new-token')
    await waitFor(() => expect(result.current.status).toBe('authenticated'))
    expect(result.current.user).toEqual(sampleUser)
  })

  it('logout 호출 시 토큰을 지우고 unauthenticated로 전환된다', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token')
    mockedAuthApi.fetchCurrentUser.mockResolvedValue(sampleUser)

    const { result } = renderUseAuth()
    await waitFor(() => expect(result.current.status).toBe('authenticated'))

    act(() => {
      result.current.logout()
    })

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    expect(result.current.status).toBe('unauthenticated')
  })
})
