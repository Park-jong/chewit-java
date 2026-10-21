import type { CategorySummary } from '@/features/categories/types'

export interface CalendarTaskItem {
  id: number
  title: string
  done: boolean
  category: CategorySummary | null
}

export interface CalendarRoutineItem {
  id: number
  title: string
  done: boolean
}

export interface CalendarEventItem {
  id: number
  title: string
  category: CategorySummary | null
}

export interface CalendarDay {
  date: string
  tasks: CalendarTaskItem[]
  routines: CalendarRoutineItem[]
  events: CalendarEventItem[]
}

export interface CalendarMonth {
  month: string
  days: CalendarDay[]
}
