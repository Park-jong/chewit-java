import { useQuery } from '@tanstack/react-query'
import { getCalendarMonth } from './api'

const CALENDAR_QUERY_KEY = ['calendar']

export function useCalendarQuery(month: string) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, month],
    queryFn: () => getCalendarMonth(month),
  })
}
