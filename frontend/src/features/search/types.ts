import type { CategorySummary } from '@/features/categories/types'
import type { RecurrenceType } from '@/features/events/types'

export const SEARCH_QUERY_MAX_LENGTH = 50

export interface SearchTaskItem {
  id: number
  title: string
  memo: string | null
  date: string
  done: boolean
  category: CategorySummary | null
}

// 시리즈 단위 결과: date는 시리즈 원본 날짜
export interface SearchEventItem {
  id: number
  title: string
  memo: string | null
  date: string
  recurrence: RecurrenceType
  category: CategorySummary | null
}

export interface SearchChecklistItem {
  id: number
  title: string
  category: CategorySummary | null
  matchedItems: string[]
}

export interface SearchResponse {
  tasks: SearchTaskItem[]
  events: SearchEventItem[]
  checklists: SearchChecklistItem[]
}
