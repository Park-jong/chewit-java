import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import { listCategories, createCategory, updateCategory, deleteCategory } from './api'
import type { Category } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleCategory: Category = {
  id: 1,
  name: '업무',
  color: '#3B82F6',
  createdAt: '2026-03-05T00:00:00Z',
}

describe('categories api', () => {
  it('listCategories는 GET /categories를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: [sampleCategory] })

    const result = await listCategories()

    expect(mockedApi.get).toHaveBeenCalledWith('/categories')
    expect(result).toEqual([sampleCategory])
  })

  it('createCategory는 POST /categories에 요청 바디를 전달한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleCategory })
    const request = { name: '업무', color: '#3B82F6' }

    const result = await createCategory(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/categories', request)
    expect(result).toEqual(sampleCategory)
  })

  it('updateCategory는 PATCH /categories/:id에 요청 바디를 전달한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...sampleCategory, name: '회사' } })
    const request = { name: '회사', color: '#EF4444' }

    const result = await updateCategory(1, request)

    expect(mockedApi.patch).toHaveBeenCalledWith('/categories/1', request)
    expect(result.name).toBe('회사')
  })

  it('deleteCategory는 DELETE /categories/:id를 호출한다', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined })

    await deleteCategory(1)

    expect(mockedApi.delete).toHaveBeenCalledWith('/categories/1')
  })
})
