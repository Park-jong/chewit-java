import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import { listRoutinesByDate, createRoutine, updateRoutine, toggleRoutine, deleteRoutine } from './api'
import type { CreateRoutineRequest, Routine, UpdateRoutineRequest } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleRoutine: Routine = {
  id: 1,
  title: '운동',
  memo: null,
  daysOfWeek: ['MONDAY'],
  active: true,
  done: false,
  createdAt: '2026-03-05T00:00:00Z',
}

describe('routines api', () => {
  it('listRoutinesByDate는 date 파라미터로 GET /routines/today를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: [sampleRoutine] })

    const result = await listRoutinesByDate('2026-03-05')

    expect(mockedApi.get).toHaveBeenCalledWith('/routines/today', { params: { date: '2026-03-05' } })
    expect(result).toEqual([sampleRoutine])
  })

  it('createRoutine은 POST /routines에 요청 바디를 전달한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleRoutine })
    const request: CreateRoutineRequest = { title: '운동', daysOfWeek: ['MONDAY'] }

    await createRoutine(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/routines', request)
  })

  it('updateRoutine은 PATCH /routines/:id에 요청 바디를 전달한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: sampleRoutine })
    const request: UpdateRoutineRequest = { title: '운동2', daysOfWeek: ['TUESDAY'], active: false }

    await updateRoutine(1, request)

    expect(mockedApi.patch).toHaveBeenCalledWith('/routines/1', request)
  })

  it('toggleRoutine은 date를 query param으로, body는 null로 PATCH한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...sampleRoutine, done: true } })

    await toggleRoutine(1, '2026-03-05')

    expect(mockedApi.patch).toHaveBeenCalledWith('/routines/1/toggle', null, {
      params: { date: '2026-03-05' },
    })
  })

  it('deleteRoutine은 DELETE /routines/:id를 호출한다', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined })

    await deleteRoutine(1)

    expect(mockedApi.delete).toHaveBeenCalledWith('/routines/1')
  })
})
