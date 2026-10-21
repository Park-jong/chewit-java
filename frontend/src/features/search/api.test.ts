import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import { search } from './api'
import type { SearchResponse } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleResponse: SearchResponse = { tasks: [], events: [], checklists: [] }

describe('search api', () => {
  it('search는 q와 categoryId로 GET /search를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: sampleResponse })

    const result = await search('회의', 5)

    expect(mockedApi.get).toHaveBeenCalledWith('/search', { params: { q: '회의', categoryId: 5 } })
    expect(result).toEqual(sampleResponse)
  })

  it('categoryId가 null이면 파라미터에서 생략한다', async () => {
    mockedApi.get.mockResolvedValue({ data: sampleResponse })

    await search('회의', null)

    expect(mockedApi.get).toHaveBeenCalledWith('/search', { params: { q: '회의', categoryId: undefined } })
  })
})
