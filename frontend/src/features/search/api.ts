import { api } from '@/lib/api'
import type { SearchResponse } from './types'

export async function search(q: string, categoryId: number | null): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>('/search', {
    params: { q, categoryId: categoryId ?? undefined },
  })
  return data
}
