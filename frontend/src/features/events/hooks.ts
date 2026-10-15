import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEvent,
  deleteEvent,
  deleteEventOccurrence,
  listEventsByMonth,
  updateEvent,
  updateEventOccurrence,
} from './api'
import type { CreateEventRequest, UpdateEventRequest, UpdateOccurrenceRequest } from './types'

const EVENTS_QUERY_KEY = ['events']

export function useEventsQuery(month: string) {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, month],
    queryFn: () => listEventsByMonth(month),
  })
}

function useInvalidateEvents() {
  const queryClient = useQueryClient()
  return () => {
    // 캘린더/통계도 이벤트 회차를 사용하므로 함께 갱신한다.
    queryClient.invalidateQueries({ queryKey: ['calendar'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    return queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY })
  }
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

export function useDeleteEventOccurrenceMutation() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: ({ id, occurrenceDate }: { id: number; occurrenceDate: string }) =>
      deleteEventOccurrence(id, occurrenceDate),
    onSuccess: invalidate,
  })
}

export function useUpdateEventOccurrenceMutation() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: ({
      id,
      occurrenceDate,
      request,
    }: {
      id: number
      occurrenceDate: string
      request: UpdateOccurrenceRequest
    }) => updateEventOccurrence(id, occurrenceDate, request),
    onSuccess: invalidate,
  })
}
