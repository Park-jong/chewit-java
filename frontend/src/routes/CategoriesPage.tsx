import { toast } from 'sonner'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '@/features/categories/hooks'
import { AddCategoryForm } from '@/features/categories/AddCategoryForm'
import { CategoryRow } from '@/features/categories/CategoryRow'
import type { Category } from '@/features/categories/types'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'

export function CategoriesPage() {
  const { user, logout } = useAuth()

  const categoriesQuery = useCategoriesQuery()
  const createCategory = useCreateCategoryMutation()
  const updateCategory = useUpdateCategoryMutation()
  const deleteCategory = useDeleteCategoryMutation()

  const isMutating = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending

  function handleAdd(name: string, color: string) {
    createCategory.mutate(
      { name, color },
      { onError: (error) => toast.error(getErrorMessage(error, '카테고리 추가에 실패했습니다.')) },
    )
  }

  function handleUpdate(id: number, name: string, color: string) {
    updateCategory.mutate(
      { id, request: { name, color } },
      { onError: (error) => toast.error(getErrorMessage(error, '카테고리 수정에 실패했습니다.')) },
    )
  }

  function handleDelete(category: Category) {
    if (!window.confirm(`'${category.name}' 카테고리를 삭제할까요? 연결된 항목은 카테고리 없음으로 바뀝니다.`)) {
      return
    }
    deleteCategory.mutate(category.id, {
      onError: (error) => toast.error(getErrorMessage(error, '삭제에 실패했습니다.')),
    })
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">chewit</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{user?.displayName}님</span>
          <Button variant="outline" onClick={logout}>
            로그아웃
          </Button>
        </div>
      </div>

      <NavBar />

      <h2 className="text-lg font-medium">카테고리</h2>

      <AddCategoryForm onAdd={handleAdd} disabled={createCategory.isPending} />

      <div className="flex flex-col gap-2">
        {categoriesQuery.isPending && (
          <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {categoriesQuery.isError && (
          <p className="text-center text-sm text-destructive">카테고리를 불러오지 못했습니다.</p>
        )}
        {categoriesQuery.data?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">카테고리가 없습니다.</p>
        )}
        {categoriesQuery.data?.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            disabled={isMutating}
          />
        ))}
      </div>
    </div>
  )
}
