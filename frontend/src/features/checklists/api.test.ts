import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import {
  listChecklists,
  createChecklist,
  renameChecklist,
  deleteChecklist,
  addChecklistItem,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
} from './api'
import type { Checklist } from './types'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleChecklist: Checklist = {
  id: 1,
  title: '장보기',
  items: [],
  createdAt: '2026-03-05T00:00:00Z',
}

describe('checklists api', () => {
  it('listChecklists는 GET /checklists를 호출한다', async () => {
    mockedApi.get.mockResolvedValue({ data: [sampleChecklist] })

    const result = await listChecklists()

    expect(mockedApi.get).toHaveBeenCalledWith('/checklists')
    expect(result).toEqual([sampleChecklist])
  })

  it('createChecklist는 POST /checklists에 요청 바디를 전달한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleChecklist })

    await createChecklist({ title: '장보기' })

    expect(mockedApi.post).toHaveBeenCalledWith('/checklists', { title: '장보기' })
  })

  it('renameChecklist는 PATCH /checklists/:id에 요청 바디를 전달한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: sampleChecklist })

    await renameChecklist(1, { title: '장보기2' })

    expect(mockedApi.patch).toHaveBeenCalledWith('/checklists/1', { title: '장보기2' })
  })

  it('deleteChecklist는 DELETE /checklists/:id를 호출한다', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined })

    await deleteChecklist(1)

    expect(mockedApi.delete).toHaveBeenCalledWith('/checklists/1')
  })

  it('addChecklistItem은 중첩 경로 POST /checklists/:id/items를 호출한다', async () => {
    mockedApi.post.mockResolvedValue({ data: sampleChecklist })

    await addChecklistItem(1, { content: '우유' })

    expect(mockedApi.post).toHaveBeenCalledWith('/checklists/1/items', { content: '우유' })
  })

  it('updateChecklistItem은 중첩 경로 PATCH /checklists/:id/items/:itemId를 호출한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: sampleChecklist })

    await updateChecklistItem(1, 2, { content: '두유' })

    expect(mockedApi.patch).toHaveBeenCalledWith('/checklists/1/items/2', { content: '두유' })
  })

  it('toggleChecklistItem은 PATCH /checklists/:id/items/:itemId/toggle을 호출한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: sampleChecklist })

    await toggleChecklistItem(1, 2)

    expect(mockedApi.patch).toHaveBeenCalledWith('/checklists/1/items/2/toggle')
  })

  it('deleteChecklistItem은 DELETE /checklists/:id/items/:itemId를 호출하고 결과를 반환한다', async () => {
    mockedApi.delete.mockResolvedValue({ data: sampleChecklist })

    const result = await deleteChecklistItem(1, 2)

    expect(mockedApi.delete).toHaveBeenCalledWith('/checklists/1/items/2')
    expect(result).toEqual(sampleChecklist)
  })

  it('reorderChecklistItems는 PATCH /checklists/:id/items/reorder에 itemIds를 전달한다', async () => {
    mockedApi.patch.mockResolvedValue({ data: sampleChecklist })

    await reorderChecklistItems(1, { itemIds: [2, 1] })

    expect(mockedApi.patch).toHaveBeenCalledWith('/checklists/1/items/reorder', { itemIds: [2, 1] })
  })
})
