import type { CategorySummary } from '@/features/categories/types'

export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export const RECURRENCE_ORDER: RecurrenceType[] = ['NONE', 'WEEKLY', 'MONTHLY', 'YEARLY']

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: '반복 없음',
  WEEKLY: '매주',
  MONTHLY: '매월',
  YEARLY: '매년',
}

export interface Event {
  id: number
  title: string
  memo: string | null
  date: string
  recurrence: RecurrenceType
  occurrenceDate: string
  createdAt: string
  category: CategorySummary | null
  overridden: boolean
}

export interface UpdateOccurrenceRequest {
  title: string
  memo?: string
}

export interface CreateEventRequest {
  title: string
  memo?: string
  date: string
  recurrence: RecurrenceType
  categoryId?: number | null
}

export interface UpdateEventRequest {
  title: string
  memo?: string
  date: string
  recurrence: RecurrenceType
  categoryId?: number | null
}
