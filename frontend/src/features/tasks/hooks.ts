import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { carryOverTasks, createTask, deleteTask, listTasks, toggleTask, updateTask } from './api'
import type { CarryOverRequest, CreateTaskRequest, UpdateTaskRequest } from './types'

const TASKS_QUERY_KEY = ['tasks']

export function useTasksQuery(date: string) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, date],
    queryFn: () => listTasks(date),
  })
}

function useInvalidateTasks() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
}

export function useCreateTaskMutation() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (request: CreateTaskRequest) => createTask(request),
    onSuccess: invalidate,
  })
}

export function useUpdateTaskMutation() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateTaskRequest }) =>
      updateTask(id, request),
    onSuccess: invalidate,
  })
}

export function useToggleTaskMutation() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (id: number) => toggleTask(id),
    onSuccess: invalidate,
  })
}

export function useCarryOverTasksMutation() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (request: CarryOverRequest) => carryOverTasks(request),
    onSuccess: invalidate,
  })
}

export function useDeleteTaskMutation() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: invalidate,
  })
}
