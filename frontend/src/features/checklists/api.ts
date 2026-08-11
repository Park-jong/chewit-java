import { api } from '@/lib/api'
import type {
  Checklist,
  CreateChecklistItemRequest,
  CreateChecklistRequest,
  ReorderItemsRequest,
  UpdateChecklistItemRequest,
  UpdateChecklistRequest,
} from './types'

export async function listChecklists(): Promise<Checklist[]> {
  const { data } = await api.get<Checklist[]>('/checklists')
  return data
}

export async function createChecklist(request: CreateChecklistRequest): Promise<Checklist> {
  const { data } = await api.post<Checklist>('/checklists', request)
  return data
}

export async function renameChecklist(id: number, request: UpdateChecklistRequest): Promise<Checklist> {
  const { data } = await api.patch<Checklist>(`/checklists/${id}`, request)
  return data
}

export async function deleteChecklist(id: number): Promise<void> {
  await api.delete(`/checklists/${id}`)
}

export async function addChecklistItem(
  checklistId: number,
  request: CreateChecklistItemRequest,
): Promise<Checklist> {
  const { data } = await api.post<Checklist>(`/checklists/${checklistId}/items`, request)
  return data
}

export async function updateChecklistItem(
  checklistId: number,
  itemId: number,
  request: UpdateChecklistItemRequest,
): Promise<Checklist> {
  const { data } = await api.patch<Checklist>(`/checklists/${checklistId}/items/${itemId}`, request)
  return data
}

export async function toggleChecklistItem(checklistId: number, itemId: number): Promise<Checklist> {
  const { data } = await api.patch<Checklist>(`/checklists/${checklistId}/items/${itemId}/toggle`)
  return data
}

export async function deleteChecklistItem(checklistId: number, itemId: number): Promise<Checklist> {
  const { data } = await api.delete<Checklist>(`/checklists/${checklistId}/items/${itemId}`)
  return data
}

export async function reorderChecklistItems(
  checklistId: number,
  request: ReorderItemsRequest,
): Promise<Checklist> {
  const { data } = await api.patch<Checklist>(`/checklists/${checklistId}/items/reorder`, request)
  return data
}
