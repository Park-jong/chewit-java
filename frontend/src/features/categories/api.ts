import { api } from '@/lib/api'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from './types'

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/categories')
  return data
}

export async function createCategory(request: CreateCategoryRequest): Promise<Category> {
  const { data } = await api.post<Category>('/categories', request)
  return data
}

export async function updateCategory(id: number, request: UpdateCategoryRequest): Promise<Category> {
  const { data } = await api.patch<Category>(`/categories/${id}`, request)
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`)
}
