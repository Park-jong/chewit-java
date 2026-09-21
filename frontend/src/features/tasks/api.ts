import { api } from '@/lib/api'
import type {
  CarryOverRequest,
  CarryOverResponse,
  CreateTaskRequest,
  Task,
  UpdateTaskRequest,
} from './types'

export async function listTasks(date: string): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks', { params: { date } })
  return data
}

export async function createTask(request: CreateTaskRequest): Promise<Task> {
  const { data } = await api.post<Task>('/tasks', request)
  return data
}

export async function updateTask(id: number, request: UpdateTaskRequest): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, request)
  return data
}

export async function toggleTask(id: number): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}/toggle`)
  return data
}

export async function carryOverTasks(request: CarryOverRequest): Promise<CarryOverResponse> {
  const { data } = await api.post<CarryOverResponse>('/tasks/carry-over', request)
  return data
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`)
}
