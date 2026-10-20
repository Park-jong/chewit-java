import type { CategorySummary } from '@/features/categories/types'

export interface Task {
  id: number
  title: string
  memo: string | null
  date: string
  done: boolean
  createdAt: string
  category: CategorySummary | null
}

export interface CreateTaskRequest {
  title: string
  memo?: string
  date: string
  categoryId?: number | null
}

export interface UpdateTaskRequest {
  title: string
  memo?: string
  date: string
  categoryId: number | null
}

export interface CarryOverRequest {
  fromDate: string
  toDate: string
}

export interface CarryOverResponse {
  movedCount: number
  toDate: string
}
