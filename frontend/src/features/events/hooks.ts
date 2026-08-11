import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEvent, deleteEvent, listEventsByMonth, updateEvent } from './api'
import type { CreateEventRequest, UpdateEventRequest } from './types'

const EVENTS_QUERY_KEY = ['events']

export function useEventsQuery(month: string) {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, month],
    queryFn: () => listEventsByMonth(month),
  })
}

function useInvalidateEvents() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY })
}

export function useCreateEventMutation() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: (request: CreateEventRequest) => createEvent(request),
    onSuccess: invalidate,
  })
}

export function useUpdateEventMutation() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateEventRequest }) =>
      updateEvent(id, request),
    onSuccess: invalidate,
  })
}

export function useDeleteEventMutation() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: invalidate,
  })
}
