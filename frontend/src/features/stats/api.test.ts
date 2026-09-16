import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import { getMonthlyStats } from './api'
import type { MonthlyStats } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleStats: MonthlyStats = {
  month: '2026-03',
  taskStats: { total: 10, completed: 7, completionRate: 0.7, daily: [] },
  routineStats: { expected: 20, completed: 15, completionRate: 0.75, daily: [] },
  checklistStats: { totalChecklists: 3, totalItems: 12, completedItems: 8, completionRate: 8 / 12 },
  eventStats: { occurrences: 2 },
}

describe('stats api', () => {
  it('getMonthlyStats는 month 파라미터로 GET /stats/monthly를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: sampleStats })

    const result = await getMonthlyStats('2026-03')

    expect(mockedApi.get).toHaveBeenCalledWith('/stats/monthly', { params: { month: '2026-03' } })
    expect(result).toEqual(sampleStats)
  })
})
