import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import { listTasks, createTask, updateTask, toggleTask, deleteTask, carryOverTasks } from './api'
import type { Task } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleTask: Task = {
  id: 1,
  title: '할일',
  memo: null,
  date: '2026-03-05',
  done: false,
  createdAt: '2026-03-05T00:00:00Z',
  category: null,
}

describe('tasks api', () => {
  it('listTasks는 date 파라미터로 GET /tasks를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: [sampleTask] })

    const result = await listTasks('2026-03-05')

    expect(mockedApi.get).toHaveBeenCalledWith('/tasks', { params: { date: '2026-03-05' } })
    expect(result).toEqual([sampleTask])
  })

  it('createTask는 POST /tasks에 요청 바디를 전달한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleTask })
    const request = { title: '할일', date: '2026-03-05' }

    const result = await createTask(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/tasks', request)
    expect(result).toEqual(sampleTask)
  })

  it('updateTask는 PATCH /tasks/:id에 요청 바디를 전달한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: sampleTask })
    const request = { title: '수정됨', date: '2026-03-06', categoryId: null }

    await updateTask(1, request)

    expect(mockedApi.patch).toHaveBeenCalledWith('/tasks/1', request)
  })

  it('createTask는 categoryId를 요청 바디에 포함해 전달한다', async () => {
    const taskWithCategory: Task = {
      ...sampleTask,
      category: { id: 5, name: '업무', color: '#3B82F6' },
    }
    mockedApi.post.mockResolvedValue({ data: taskWithCategory })
    const request = { title: '할일', date: '2026-03-05', categoryId: 5 }

    const result = await createTask(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/tasks', request)
    expect(result.category?.name).toBe('업무')
  })

  it('updateTask는 categoryId가 null이면 null 그대로 전달해 카테고리를 해제한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: sampleTask })
    const request = { title: '할일', date: '2026-03-06', categoryId: null }

    await updateTask(1, request)

    expect(mockedApi.patch).toHaveBeenCalledWith('/tasks/1', request)
  })

  it('toggleTask는 PATCH /tasks/:id/toggle을 호출한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...sampleTask, done: true } })

    await toggleTask(1)

    expect(mockedApi.patch).toHaveBeenCalledWith('/tasks/1/toggle')
  })

  it('carryOverTasks는 POST /tasks/carry-over에 요청 바디를 전달하고 응답을 반환한다', async () => {
    const response = { movedCount: 2, toDate: '2026-03-06' }
    mockedApi.post.mockResolvedValue({ data: response })
    const request = { fromDate: '2026-03-05', toDate: '2026-03-06' }

    const result = await carryOverTasks(request)

    expect(mockedApi.post).toHaveBeenCalledWith('/tasks/carry-over', request)
    expect(result).toEqual(response)
  })

  it('deleteTask는 DELETE /tasks/:id를 호출한다', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined })

    await deleteTask(1)

    expect(mockedApi.delete).toHaveBeenCalledWith('/tasks/1')
  })
})
