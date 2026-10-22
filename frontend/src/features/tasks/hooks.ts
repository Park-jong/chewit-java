import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { carryOverTasks, createTask, deleteTask, listTasks, toggleTask, updateTask } from './api'
import type { CarryOverRequest, CreateTaskRequest, UpdateTaskRequest } from './types'

const TASKS_QUERY_KEY = ['tasks']
// Task 변경은 캘린더·월간 통계에도 영향을 주므로 함께 무효화한다 (prefix 매칭으로 월별 키 전부 포함)
const CALENDAR_QUERY_KEY = ['calendar']
const STATS_QUERY_KEY = ['stats']

export function useTasksQuery(date: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, date],
    queryFn: () => listTasks(date),
    enabled: options?.enabled ?? true,
  })
}

function useInvalidateTasks() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY }),
    ])
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
