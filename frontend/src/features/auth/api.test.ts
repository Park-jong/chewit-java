import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import { signup, login, fetchCurrentUser } from './api'
import type { AuthResponse, UserResponse } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleUser: UserResponse = { id: 1, email: 'test@test.com', displayName: '닉네임' }
const sampleAuth: AuthResponse = { token: 'token', user: sampleUser }

describe('auth api', () => {
  it('signup은 POST /auth/signup에 요청 바디를 전달한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleAuth })
    const request = { email: 'test@test.com', password: 'password123', displayName: '닉네임' }

    const result = await signup(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/signup', request)
    expect(result).toEqual(sampleAuth)
  })

  it('login은 POST /auth/login에 요청 바디를 전달한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleAuth })
    const request = { email: 'test@test.com', password: 'password123' }

    await login(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', request)
  })

  it('fetchCurrentUser는 GET /auth/me를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: sampleUser })

    const result = await fetchCurrentUser()

    expect(mockedApi.get).toHaveBeenCalledWith('/auth/me')
    expect(result).toEqual(sampleUser)
  })
})
