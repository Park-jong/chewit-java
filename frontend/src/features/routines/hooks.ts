import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRoutine, deleteRoutine, listRoutinesByDate, toggleRoutine, updateRoutine } from './api'
import type { CreateRoutineRequest, UpdateRoutineRequest } from './types'

const ROUTINES_QUERY_KEY = ['routines']

export function useRoutinesQuery(date: string) {
  return useQuery({
    queryKey: [...ROUTINES_QUERY_KEY, date],
    queryFn: () => listRoutinesByDate(date),
  })
}

function useInvalidateRoutines() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ROUTINES_QUERY_KEY })
}

export function useCreateRoutineMutation() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: (request: CreateRoutineRequest) => createRoutine(request),
    onSuccess: invalidate,
  })
}

export function useUpdateRoutineMutation() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateRoutineRequest }) =>
      updateRoutine(id, request),
    onSuccess: invalidate,
  })
}

export function useToggleRoutineMutation() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => toggleRoutine(id, date),
    onSuccess: invalidate,
  })
}

export function useDeleteRoutineMutation() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: (id: number) => deleteRoutine(id),
    onSuccess: invalidate,
  })
}
