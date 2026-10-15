import { api } from '@/lib/api'
import type {
  CreateEventRequest,
  Event,
  UpdateEventRequest,
  UpdateOccurrenceRequest,
} from './types'

export async function listEventsByMonth(month: string): Promise<Event[]> {
  const { data } = await api.get<Event[]>('/events', { params: { month } })
  return data
}

export async function createEvent(request: CreateEventRequest): Promise<Event> {
  const { data } = await api.post<Event>('/events', request)
  return data
}

export async function updateEvent(id: number, request: UpdateEventRequest): Promise<Event> {
  const { data } = await api.patch<Event>(`/events/${id}`, request)
  return data
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/events/${id}`)
}

export async function deleteEventOccurrence(id: number, occurrenceDate: string): Promise<void> {
  await api.delete(`/events/${id}/occurrences/${occurrenceDate}`)
}

export async function updateEventOccurrence(
  id: number,
  occurrenceDate: string,
  request: UpdateOccurrenceRequest,
): Promise<Event> {
  const { data } = await api.patch<Event>(`/events/${id}/occurrences/${occurrenceDate}`, request)
  return data
}
