import { api } from '@/lib/api'
import type { CreateEventRequest, Event, UpdateEventRequest } from './types'

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
