import { api } from '@/lib/api'
import type { CreateRoutineRequest, Routine, UpdateRoutineRequest } from './types'

export async function listRoutinesByDate(date: string): Promise<Routine[]> {
  const { data } = await api.get<Routine[]>('/routines/today', { params: { date } })
  return data
}

export async function createRoutine(request: CreateRoutineRequest): Promise<Routine> {
  const { data } = await api.post<Routine>('/routines', request)
  return data
}

export async function updateRoutine(id: number, request: UpdateRoutineRequest): Promise<Routine> {
  const { data } = await api.patch<Routine>(`/routines/${id}`, request)
  return data
}

export async function toggleRoutine(id: number, date: string): Promise<Routine> {
  const { data } = await api.patch<Routine>(`/routines/${id}/toggle`, null, { params: { date } })
  return data
}

export async function deleteRoutine(id: number): Promise<void> {
  await api.delete(`/routines/${id}`)
}
