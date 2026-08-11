import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useChecklistsQuery,
  useCreateChecklistMutation,
  useDeleteChecklistMutation,
} from '@/features/checklists/hooks'
import { AddChecklistForm } from '@/features/checklists/AddChecklistForm'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'

export function ChecklistsPage() {
  const { user, logout } = useAuth()

  const checklistsQuery = useChecklistsQuery()
  const createChecklist = useCreateChecklistMutation()
  const deleteChecklist = useDeleteChecklistMutation()

  const isMutating = createChecklist.isPending || deleteChecklist.isPending

  function handleAdd(title: string) {
    createChecklist.mutate(
      { title },
      { onError: (error) => toast.error(getErrorMessage(error, '체크리스트 추가에 실패했습니다.')) },
    )
  }

  function handleDelete(id: number) {
    deleteChecklist.mutate(id, {
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

      <div className="flex gap-4">
        <Link to="/" className="text-sm text-primary underline underline-offset-4">
          오늘 화면으로
        </Link>
        <Link to="/events" className="text-sm text-primary underline underline-offset-4">
          이벤트 화면으로
        </Link>
      </div>

      <h2 className="text-lg font-medium">체크리스트</h2>

      <AddChecklistForm onAdd={handleAdd} disabled={createChecklist.isPending} />

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
          return (
            <div key={checklist.id} className="flex items-center gap-3 rounded-md border p-3">
              <Link to={`/checklists/${checklist.id}`} className="min-w-0 flex-1">
                <p className="truncate">{checklist.title}</p>
                <p className="text-sm text-muted-foreground">
                  {doneCount}/{checklist.items.length} 완료
                </p>
              </Link>
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
          )
        })}
      </div>
    </div>
  )
}
