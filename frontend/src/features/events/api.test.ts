import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import {
  listEventsByMonth,
  createEvent,
  updateEvent,
  deleteEvent,
  deleteEventOccurrence,
  updateEventOccurrence,
} from './api'
import type { CreateEventRequest, Event } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleEvent: Event = {
  id: 1,
  title: '생일',
  memo: null,
  date: '2026-03-05',
  recurrence: 'YEARLY',
  occurrenceDate: '2026-03-05',
  createdAt: '2026-03-05T00:00:00Z',
  category: null,
  overridden: false,
  seriesTitle: '생일',
  seriesMemo: null,
}

describe('events api', () => {
  it('listEventsByMonth는 month 파라미터로 GET /events를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: [sampleEvent] })

    const result = await listEventsByMonth('2026-03')

    expect(mockedApi.get).toHaveBeenCalledWith('/events', { params: { month: '2026-03' } })
    expect(result).toEqual([sampleEvent])
  })

  it('createEvent는 POST /events에 요청 바디를 전달한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleEvent })
    const request = { title: '생일', date: '2026-03-05', recurrence: 'YEARLY' as const }

    await createEvent(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/events', request)
  })

  it('createEvent는 categoryId를 요청 바디에 포함해 전달한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleEvent })
    const request: CreateEventRequest = {
      title: '생일',
      date: '2026-03-05',
      recurrence: 'YEARLY',
      categoryId: 5,
    }

    await createEvent(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/events', request)
  })

  it('updateEvent는 PATCH /events/:id에 요청 바디를 전달한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: sampleEvent })
    const request = { title: '생일2', date: '2026-03-06', recurrence: 'NONE' as const, categoryId: null }

    await updateEvent(1, request)

    expect(mockedApi.patch).toHaveBeenCalledWith('/events/1', request)
  })

  it('deleteEventOccurrence는 DELETE /events/:id/occurrences/:date를 호출한다', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined })

    await deleteEventOccurrence(1, '2026-03-12')

    expect(mockedApi.delete).toHaveBeenCalledWith('/events/1/occurrences/2026-03-12')
  })

  it('updateEventOccurrence는 PATCH /events/:id/occurrences/:date에 바디를 전달한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...sampleEvent, overridden: true } })
    const request = { title: '이번만', memo: '메모' }

    const result = await updateEventOccurrence(1, '2026-03-12', request)

    expect(mockedApi.patch).toHaveBeenCalledWith('/events/1/occurrences/2026-03-12', request)
    expect(result.overridden).toBe(true)
  })

  it('deleteEvent는 DELETE /events/:id를 호출한다', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined })

    await deleteEvent(1)

    expect(mockedApi.delete).toHaveBeenCalledWith('/events/1')
  })
})
