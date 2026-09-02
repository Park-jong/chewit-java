import { api } from '@/lib/api'
import type { MonthlyStats } from './types'

export async function getMonthlyStats(month: string): Promise<MonthlyStats> {
  const { data } = await api.get<MonthlyStats>('/stats/monthly', { params: { month } })
  return data
}
