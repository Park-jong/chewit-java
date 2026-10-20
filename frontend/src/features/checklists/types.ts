import type { CategorySummary } from '@/features/categories/types'

export interface ChecklistItem {
  id: number
  content: string
  checked: boolean
  sortOrder: number
}

export interface Checklist {
  id: number
  title: string
  items: ChecklistItem[]
  createdAt: string
  category: CategorySummary | null
}

export interface CreateChecklistRequest {
  title: string
  categoryId?: number | null
}

export interface UpdateChecklistRequest {
  title: string
  categoryId: number | null
}

export interface CreateChecklistItemRequest {
  content: string
}

export interface UpdateChecklistItemRequest {
  content: string
}

export interface ReorderItemsRequest {
  itemIds: number[]
}
