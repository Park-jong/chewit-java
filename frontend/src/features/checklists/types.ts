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
}

export interface CreateChecklistRequest {
  title: string
}

export interface UpdateChecklistRequest {
  title: string
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
