import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import { getCalendarMonth } from './api'
import type { CalendarMonth } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleMonth: CalendarMonth = {
  month: '2026-03',
  days: [
    {
      date: '2026-03-05',
      tasks: [{ id: 1, title: '장보기', done: false, category: null }],
      routines: [{ id: 2, title: '운동', done: true }],
      events: [{ id: 3, title: '생일', category: null }],
    },
  ],
}

describe('calendar api', () => {
  it('getCalendarMonth는 month 파라미터로 GET /calendar를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: sampleMonth })

    const result = await getCalendarMonth('2026-03')

    expect(mockedApi.get).toHaveBeenCalledWith('/calendar', { params: { month: '2026-03' } })
    expect(result).toEqual(sampleMonth)
  })
})
