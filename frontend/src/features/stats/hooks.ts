import { useQuery } from '@tanstack/react-query'
import { getMonthlyStats } from './api'

export function useMonthlyStatsQuery(month: string) {
  return useQuery({
    queryKey: ['stats', 'monthly', month],
    queryFn: () => getMonthlyStats(month),
  })
}
