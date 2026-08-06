import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useToggleTaskMutation,
} from '@/features/tasks/hooks'
import { TaskItem } from '@/features/tasks/TaskItem'
import { AddTaskForm } from '@/features/tasks/AddTaskForm'
import { addDaysISO, formatDisplayDate, todayISO } from '@/lib/date'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [date, setDate] = useState(todayISO())

  const tasksQuery = useTasksQuery(date)
  const createTask = useCreateTaskMutation()
  const toggleTask = useToggleTaskMutation()
  const deleteTask = useDeleteTaskMutation()

  const isMutating = createTask.isPending || toggleTask.isPending || deleteTask.isPending

  function handleAdd(title: string) {
    createTask.mutate(
      { title, date },
      { onError: (error) => toast.error(getErrorMessage(error, '할일 추가에 실패했습니다.')) },
    )
  }

  function handleToggle(id: number) {
    toggleTask.mutate(id, {
      onError: (error) => toast.error(getErrorMessage(error, '상태 변경에 실패했습니다.')),
    })
  }

  function handleDelete(id: number) {
    deleteTask.mutate(id, {
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

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setDate((d) => addDaysISO(d, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium">{formatDisplayDate(date)}</span>
          {date !== todayISO() && (
            <button
              type="button"
              className="text-xs text-primary underline underline-offset-4"
              onClick={() => setDate(todayISO())}
            >
              오늘로 이동
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDate((d) => addDaysISO(d, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <AddTaskForm onAdd={handleAdd} disabled={createTask.isPending} />

      <div className="flex flex-col gap-2">
        {tasksQuery.isPending && (
          <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {tasksQuery.isError && (
          <p className="text-center text-sm text-destructive">할일을 불러오지 못했습니다.</p>
        )}
        {tasksQuery.data?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">이 날은 할일이 없습니다.</p>
        )}
        {tasksQuery.data?.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={handleToggle}
            onDelete={handleDelete}
            disabled={isMutating}
          />
        ))}
      </div>
    </div>
  )
}
