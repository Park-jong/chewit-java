import { useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useAddChecklistItemMutation,
  useChecklistsQuery,
  useCreateChecklistMutation,
  useDeleteChecklistItemMutation,
  useDeleteChecklistMutation,
  useRenameChecklistMutation,
  useReorderChecklistItemsMutation,
  useToggleChecklistItemMutation,
} from '@/features/checklists/hooks'
import { AddChecklistForm } from '@/features/checklists/AddChecklistForm'
import { useCategoriesQuery } from '@/features/categories/hooks'
import { CategoryBadge } from '@/features/categories/CategoryBadge'
import { CategorySelect } from '@/features/categories/CategorySelect'
import { AddChecklistItemForm } from '@/features/checklists/AddChecklistItemForm'
import { ChecklistItemRow } from '@/features/checklists/ChecklistItemRow'
import { reorderByDrag } from '@/features/checklists/reorder'
import type { Checklist } from '@/features/checklists/types'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ChecklistsPage() {
  const { user, logout } = useAuth()

  const checklistsQuery = useChecklistsQuery()
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []
  const createChecklist = useCreateChecklistMutation()
  const deleteChecklist = useDeleteChecklistMutation()
  const renameChecklist = useRenameChecklistMutation()
  const addItem = useAddChecklistItemMutation()
  const toggleItem = useToggleChecklistItemMutation()
  const deleteItem = useDeleteChecklistItemMutation()
  const reorderItems = useReorderChecklistItemsMutation()

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [draggedChecklistId, setDraggedChecklistId] = useState<number | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null)

  const isMutating = createChecklist.isPending || deleteChecklist.isPending
  const isItemMutating =
    renameChecklist.isPending ||
    addItem.isPending ||
    toggleItem.isPending ||
    deleteItem.isPending ||
    reorderItems.isPending

  function handleAdd(title: string, categoryId: number | null) {
    createChecklist.mutate(
      { title, categoryId },
      { onError: (error) => toast.error(getErrorMessage(error, '체크리스트 추가에 실패했습니다.')) },
    )
  }

  function handleDelete(id: number) {
    deleteChecklist.mutate(id, {
      onError: (error) => toast.error(getErrorMessage(error, '삭제에 실패했습니다.')),
    })
    if (expandedId === id) setExpandedId(null)
  }

  function handleToggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id))
    setTitle(null)
  }

  function handleRenameSubmit(event: FormEvent, checklist: Checklist) {
    event.preventDefault()
    if (title === null) return
    const trimmed = title.trim()
    if (!trimmed) return
    if (trimmed === checklist.title) {
      setTitle(null)
      return
    }
    renameChecklist.mutate(
      { id: checklist.id, request: { title: trimmed, categoryId: checklist.category?.id ?? null } },
      {
        onSuccess: () => setTitle(null),
        onError: (error) => toast.error(getErrorMessage(error, '이름 변경에 실패했습니다.')),
      },
    )
  }

  function handleChangeCategory(checklist: Checklist, categoryId: number | null) {
    renameChecklist.mutate(
      { id: checklist.id, request: { title: checklist.title, categoryId } },
      { onError: (error) => toast.error(getErrorMessage(error, '카테고리 변경에 실패했습니다.')) },
    )
  }

  function handleAddItem(checklistId: number, content: string) {
    addItem.mutate(
      { checklistId, request: { content } },
      { onError: (error) => toast.error(getErrorMessage(error, '항목 추가에 실패했습니다.')) },
    )
  }

  function handleToggle(checklistId: number, itemId: number) {
    toggleItem.mutate(
      { checklistId, itemId },
      { onError: (error) => toast.error(getErrorMessage(error, '상태 변경에 실패했습니다.')) },
    )
  }

  function handleDeleteItem(checklistId: number, itemId: number) {
    deleteItem.mutate(
      { checklistId, itemId },
      { onError: (error) => toast.error(getErrorMessage(error, '삭제에 실패했습니다.')) },
    )
  }

  function handleMove(checklist: Checklist, itemId: number, direction: 'up' | 'down') {
    const items = checklist.items
    const index = items.findIndex((item) => item.id === itemId)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (index === -1 || targetIndex < 0 || targetIndex >= items.length) return

    const reordered = [...items]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    reorderItems.mutate(
      { checklistId: checklist.id, request: { itemIds: reordered.map((item) => item.id) } },
      { onError: (error) => toast.error(getErrorMessage(error, '순서 변경에 실패했습니다.')) },
    )
  }

  function handleItemDragStart(checklistId: number, itemId: number) {
    setDraggedChecklistId(checklistId)
    setDraggedItemId(itemId)
  }

  function handleItemDragOver(checklistId: number, itemId: number) {
    if (checklistId !== draggedChecklistId) return
    setDragOverItemId(itemId)
  }

  function handleItemDragEnd() {
    setDraggedChecklistId(null)
    setDraggedItemId(null)
    setDragOverItemId(null)
  }

  function handleItemDrop(checklist: Checklist, targetItemId: number) {
    const sourceItemId = draggedItemId
    handleItemDragEnd()
    if (sourceItemId === null) return

    // 같은 항목 드롭은 reorderByDrag가 null을 반환해 API 호출 없이 종료된다.
    const itemIds = reorderByDrag(checklist.items, sourceItemId, targetItemId)
    if (itemIds === null) return

    reorderItems.mutate(
      { checklistId: checklist.id, request: { itemIds } },
      { onError: (error) => toast.error(getErrorMessage(error, '순서 변경에 실패했습니다.')) },
    )
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

      <h2 className="text-lg font-medium">체크리스트</h2>

      <AddChecklistForm onAdd={handleAdd} categories={categories} disabled={createChecklist.isPending} />

      <div className="flex flex-col gap-2">
        {checklistsQuery.isPending && (
          <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {checklistsQuery.isError && (
          <p className="text-center text-sm text-destructive">체크리스트를 불러오지 못했습니다.</p>
        )}
        {checklistsQuery.data?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">체크리스트가 없습니다.</p>
        )}
        {checklistsQuery.data?.map((checklist) => {
          const doneCount = checklist.items.filter((item) => item.checked).length
          const isExpanded = expandedId === checklist.id
          return (
            <div key={checklist.id} className="rounded-md border">
              <div className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => handleToggleExpand(checklist.id)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1">
                    <p className="truncate">{checklist.title}</p>
                    <CategoryBadge category={checklist.category} />
                    <p className="text-sm text-muted-foreground">
                      {doneCount}/{checklist.items.length} 완료
                    </p>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isMutating}
                  onClick={() => handleDelete(checklist.id)}
                  aria-label="삭제"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {isExpanded && (
                <div className="flex flex-col gap-3 border-t p-3">
                  <form onSubmit={(event) => handleRenameSubmit(event, checklist)} className="flex gap-2">
                    <Input
                      value={title ?? checklist.title}
                      onChange={(event) => setTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setTitle(null)
                      }}
                      disabled={renameChecklist.isPending}
                    />
                    <Button type="submit" variant="outline" disabled={renameChecklist.isPending}>
                      이름 변경
                    </Button>
                  </form>

                  <CategorySelect
                    categories={categories}
                    value={checklist.category?.id ?? null}
                    onChange={(categoryId) => handleChangeCategory(checklist, categoryId)}
                    disabled={renameChecklist.isPending}
                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                  />

                  <AddChecklistItemForm
                    onAdd={(content) => handleAddItem(checklist.id, content)}
                    disabled={addItem.isPending}
                  />

                  <div className="flex flex-col gap-2">
                    {checklist.items.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground">항목이 없습니다.</p>
                    )}
                    {checklist.items.map((item, index) => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        isFirst={index === 0}
                        isLast={index === checklist.items.length - 1}
                        isDragging={draggedItemId === item.id}
                        isDragOver={dragOverItemId === item.id && draggedItemId !== item.id}
                        onToggle={(itemId) => handleToggle(checklist.id, itemId)}
                        onDelete={(itemId) => handleDeleteItem(checklist.id, itemId)}
                        onMoveUp={(itemId) => handleMove(checklist, itemId, 'up')}
                        onMoveDown={(itemId) => handleMove(checklist, itemId, 'down')}
                        onDragStart={(itemId) => handleItemDragStart(checklist.id, itemId)}
                        onDragOverItem={(itemId) => handleItemDragOver(checklist.id, itemId)}
                        onDrop={(itemId) => handleItemDrop(checklist, itemId)}
                        onDragEnd={handleItemDragEnd}
                        disabled={isItemMutating}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
