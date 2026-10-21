import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCategory, deleteCategory, listCategories, updateCategory } from './api'
import type { CreateCategoryRequest, UpdateCategoryRequest } from './types'

const CATEGORIES_QUERY_KEY = ['categories']

// 카테고리 이름/색 변경·삭제는 카테고리가 표시되는 목록에도 반영되어야 한다.
const CATEGORY_DEPENDENT_QUERY_KEYS: string[][] = [
  CATEGORIES_QUERY_KEY,
  ['tasks'],
  ['events'],
  ['checklists'],
  ['calendar'],
]

export function useCategoriesQuery() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: listCategories,
  })
}

function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      CATEGORY_DEPENDENT_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    )
}

export function useCreateCategoryMutation() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (request: CreateCategoryRequest) => createCategory(request),
    onSuccess: invalidate,
  })
}

export function useUpdateCategoryMutation() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateCategoryRequest }) =>
      updateCategory(id, request),
    onSuccess: invalidate,
  })
}

export function useDeleteCategoryMutation() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: invalidate,
  })
}
