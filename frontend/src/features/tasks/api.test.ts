import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import { listTasks, createTask, updateTask, toggleTask, deleteTask } from './api'
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
    const request = { title: '수정됨', date: '2026-03-06' }

    await updateTask(1, request)

    expect(mockedApi.patch).toHaveBeenCalledWith('/tasks/1', request)
  })

  it('toggleTask는 PATCH /tasks/:id/toggle을 호출한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...sampleTask, done: true } })

    await toggleTask(1)

    expect(mockedApi.patch).toHaveBeenCalledWith('/tasks/1/toggle')
  })

  it('deleteTask는 DELETE /tasks/:id를 호출한다', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined })

    await deleteTask(1)

    expect(mockedApi.delete).toHaveBeenCalledWith('/tasks/1')
  })
})
