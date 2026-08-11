import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useAddChecklistItemMutation,
  useChecklistsQuery,
  useDeleteChecklistItemMutation,
  useRenameChecklistMutation,
  useReorderChecklistItemsMutation,
  useToggleChecklistItemMutation,
} from '@/features/checklists/hooks'
import { ChecklistItemRow } from '@/features/checklists/ChecklistItemRow'
import { AddChecklistItemForm } from '@/features/checklists/AddChecklistItemForm'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ChecklistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const checklistId = Number(id)
  const { user, logout } = useAuth()

  const checklistsQuery = useChecklistsQuery()
  const renameChecklist = useRenameChecklistMutation()
  const addItem = useAddChecklistItemMutation()
  const toggleItem = useToggleChecklistItemMutation()
  const deleteItem = useDeleteChecklistItemMutation()
  const reorderItems = useReorderChecklistItemsMutation()

  const [title, setTitle] = useState<string | null>(null)

  const checklist = checklistsQuery.data?.find((c) => c.id === checklistId)
  const isMutating =
    renameChecklist.isPending ||
    addItem.isPending ||
    toggleItem.isPending ||
    deleteItem.isPending ||
    reorderItems.isPending

  function handleRenameSubmit(event: FormEvent) {
    event.preventDefault()
    if (title === null) return
    const trimmed = title.trim()
    if (!trimmed || !checklist || trimmed === checklist.title) return
    renameChecklist.mutate(
      { id: checklistId, request: { title: trimmed } },
      { onError: (error) => toast.error(getErrorMessage(error, '이름 변경에 실패했습니다.')) },
    )
  }

  function handleAddItem(content: string) {
    addItem.mutate(
      { checklistId, request: { content } },
      { onError: (error) => toast.error(getErrorMessage(error, '항목 추가에 실패했습니다.')) },
    )
  }

  function handleToggle(itemId: number) {
    toggleItem.mutate(
      { checklistId, itemId },
      { onError: (error) => toast.error(getErrorMessage(error, '상태 변경에 실패했습니다.')) },
    )
  }

  function handleDeleteItem(itemId: number) {
    deleteItem.mutate(
      { checklistId, itemId },
      { onError: (error) => toast.error(getErrorMessage(error, '삭제에 실패했습니다.')) },
    )
  }

  function handleMove(itemId: number, direction: 'up' | 'down') {
    if (!checklist) return
    const items = checklist.items
    const index = items.findIndex((item) => item.id === itemId)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (index === -1 || targetIndex < 0 || targetIndex >= items.length) return

    const reordered = [...items]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    reorderItems.mutate(
      { checklistId, request: { itemIds: reordered.map((item) => item.id) } },
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

      <Link to="/checklists" className="text-sm text-primary underline underline-offset-4">
        체크리스트 목록으로
      </Link>

      {checklistsQuery.isPending && (
        <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {checklistsQuery.isError && (
        <p className="text-center text-sm text-destructive">체크리스트를 불러오지 못했습니다.</p>
      )}
      {!checklistsQuery.isPending && !checklistsQuery.isError && !checklist && (
        <p className="text-center text-sm text-muted-foreground">체크리스트를 찾을 수 없습니다.</p>
      )}

      {checklist && (
        <>
          <form onSubmit={handleRenameSubmit} className="flex gap-2">
            <Input
              value={title ?? checklist.title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => setTitle(null)}
              disabled={renameChecklist.isPending}
            />
            <Button type="submit" variant="outline" disabled={renameChecklist.isPending}>
              이름 변경
            </Button>
          </form>

          <AddChecklistItemForm onAdd={handleAddItem} disabled={addItem.isPending} />

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
                onToggle={handleToggle}
                onDelete={handleDeleteItem}
                onMoveUp={(itemId) => handleMove(itemId, 'up')}
                onMoveDown={(itemId) => handleMove(itemId, 'down')}
                disabled={isMutating}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
