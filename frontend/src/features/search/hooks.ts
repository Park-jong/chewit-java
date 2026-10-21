import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { search } from './api'

export function useSearchQuery(q: string, categoryId: number | null) {
  return useQuery({
    queryKey: ['search', q, categoryId],
    queryFn: () => search(q, categoryId),
    enabled: q.trim().length > 0,
  })
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
