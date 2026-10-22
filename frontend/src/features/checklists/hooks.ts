import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addChecklistItem,
  createChecklist,
  deleteChecklist,
  deleteChecklistItem,
  duplicateChecklist,
  listChecklists,
  renameChecklist,
  reorderChecklistItems,
  toggleChecklistItem,
  updateChecklistItem,
} from './api'
import type {
  CreateChecklistItemRequest,
  CreateChecklistRequest,
  ReorderItemsRequest,
  UpdateChecklistItemRequest,
  UpdateChecklistRequest,
} from './types'

const CHECKLISTS_QUERY_KEY = ['checklists']

export function useChecklistsQuery() {
  return useQuery({
    queryKey: CHECKLISTS_QUERY_KEY,
    queryFn: listChecklists,
  })
}

function useInvalidateChecklists() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: CHECKLISTS_QUERY_KEY })
}

export function useCreateChecklistMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: (request: CreateChecklistRequest) => createChecklist(request),
    onSuccess: invalidate,
  })
}

export function useDuplicateChecklistMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: (id: number) => duplicateChecklist(id),
    onSuccess: invalidate,
  })
}

export function useRenameChecklistMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateChecklistRequest }) =>
      renameChecklist(id, request),
    onSuccess: invalidate,
  })
}

export function useDeleteChecklistMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: (id: number) => deleteChecklist(id),
    onSuccess: invalidate,
  })
}

export function useAddChecklistItemMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: ({ checklistId, request }: { checklistId: number; request: CreateChecklistItemRequest }) =>
      addChecklistItem(checklistId, request),
    onSuccess: invalidate,
  })
}

export function useUpdateChecklistItemMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: ({
      checklistId,
      itemId,
      request,
    }: {
      checklistId: number
      itemId: number
      request: UpdateChecklistItemRequest
    }) => updateChecklistItem(checklistId, itemId, request),
    onSuccess: invalidate,
  })
}

export function useToggleChecklistItemMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: ({ checklistId, itemId }: { checklistId: number; itemId: number }) =>
      toggleChecklistItem(checklistId, itemId),
    onSuccess: invalidate,
  })
}

export function useDeleteChecklistItemMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: ({ checklistId, itemId }: { checklistId: number; itemId: number }) =>
      deleteChecklistItem(checklistId, itemId),
    onSuccess: invalidate,
  })
}

export function useReorderChecklistItemsMutation() {
  const invalidate = useInvalidateChecklists()
  return useMutation({
    mutationFn: ({ checklistId, request }: { checklistId: number; request: ReorderItemsRequest }) =>
      reorderChecklistItems(checklistId, request),
    onSuccess: invalidate,
  })
}
