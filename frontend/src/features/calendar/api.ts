import { api } from '@/lib/api'
import type { CalendarMonth } from './types'

export async function getCalendarMonth(month: string): Promise<CalendarMonth> {
  const { data } = await api.get<CalendarMonth>('/calendar', { params: { month } })
  return data
}
