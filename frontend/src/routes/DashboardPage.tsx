import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useCarryOverTasksMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useToggleTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks'
import type { Task, UpdateTaskRequest } from '@/features/tasks/types'
import { TaskItem } from '@/features/tasks/TaskItem'
import { AddTaskForm } from '@/features/tasks/AddTaskForm'
import {
  useCreateRoutineMutation,
  useDeleteRoutineMutation,
  useRoutinesQuery,
  useToggleRoutineMutation,
} from '@/features/routines/hooks'
import { RoutineItem } from '@/features/routines/RoutineItem'
import { AddRoutineForm } from '@/features/routines/AddRoutineForm'
import type { DayOfWeek } from '@/features/routines/types'
import { useEventsQuery } from '@/features/events/hooks'
import { useCategoriesQuery } from '@/features/categories/hooks'
import { CategoryBadge } from '@/features/categories/CategoryBadge'
import { RECURRENCE_LABELS } from '@/features/events/types'
import { addDaysISO, formatDisplayDate, todayISO } from '@/lib/date'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [date, setDate] = useState(todayISO())
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)

  const tasksQuery = useTasksQuery(date)
  const createTask = useCreateTaskMutation()
  const toggleTask = useToggleTaskMutation()
  const deleteTask = useDeleteTaskMutation()
  const updateTask = useUpdateTaskMutation()
  const carryOverTasks = useCarryOverTasksMutation()

  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const routinesQuery = useRoutinesQuery(date)
  const createRoutine = useCreateRoutineMutation()
  const toggleRoutine = useToggleRoutineMutation()
  const deleteRoutine = useDeleteRoutineMutation()

  const eventsQuery = useEventsQuery(date.slice(0, 7))
  const todaysEvents = eventsQuery.data?.filter((event) => event.occurrenceDate === date)

  const incompleteCount = tasksQuery.data?.filter((task) => !task.done).length ?? 0

  // 삭제된 카테고리가 필터로 남아 있으면 전체로 취급한다.
  const activeFilter = categories.some((category) => category.id === categoryFilter) ? categoryFilter : null
  const visibleTasks =
    activeFilter === null
      ? tasksQuery.data
      : tasksQuery.data?.filter((task) => task.category?.id === activeFilter)

  const isMutating =
    createTask.isPending ||
    toggleTask.isPending ||
    deleteTask.isPending ||
    updateTask.isPending ||
    carryOverTasks.isPending
  const isRoutineMutating =
    createRoutine.isPending || toggleRoutine.isPending || deleteRoutine.isPending

  function handleAdd(title: string, categoryId: number | null) {
    createTask.mutate(
      { title, date, categoryId },
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

  function handleMoveToTomorrow(task: Task) {
    updateTask.mutate(
      {
        id: task.id,
        request: {
          title: task.title,
          memo: task.memo ?? undefined,
          date: addDaysISO(task.date, 1),
          categoryId: task.category?.id ?? null,
        },
      },
      { onError: (error) => toast.error(getErrorMessage(error, '이월에 실패했습니다.')) },
    )
  }

  function handleUpdate(id: number, request: UpdateTaskRequest) {
    updateTask.mutate(
      { id, request },
      { onError: (error) => toast.error(getErrorMessage(error, '수정에 실패했습니다.')) },
    )
  }

  function handleCarryOver() {
    carryOverTasks.mutate(
      { fromDate: date, toDate: addDaysISO(date, 1) },
      {
        onSuccess: (result) => toast.success(`${result.movedCount}개를 이월했어요`),
        onError: (error) => toast.error(getErrorMessage(error, '이월에 실패했습니다.')),
      },
    )
  }

  function handleAddRoutine(title: string, daysOfWeek: DayOfWeek[]) {
    createRoutine.mutate(
      { title, daysOfWeek },
      { onError: (error) => toast.error(getErrorMessage(error, '루틴 추가에 실패했습니다.')) },
    )
  }

  function handleToggleRoutine(id: number) {
    toggleRoutine.mutate(
      { id, date },
      { onError: (error) => toast.error(getErrorMessage(error, '상태 변경에 실패했습니다.')) },
    )
  }

  function handleDeleteRoutine(id: number) {
    deleteRoutine.mutate(id, {
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

      <AddTaskForm onAdd={handleAdd} categories={categories} disabled={createTask.isPending} />

      <div className="flex flex-col gap-2">
        {tasksQuery.isPending && (
          <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {tasksQuery.isError && (
          <p className="text-center text-sm text-destructive">할일을 불러오지 못했습니다.</p>
        )}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="카테고리 필터">
            <button
              type="button"
              aria-pressed={activeFilter === null}
              onClick={() => setCategoryFilter(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                activeFilter === null
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={activeFilter === category.id}
                onClick={() => setCategoryFilter(category.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                  activeFilter === category.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </button>
            ))}
          </div>
        )}
        {tasksQuery.data?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">이 날은 할일이 없습니다.</p>
        )}
        {tasksQuery.data?.length !== 0 && visibleTasks?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">이 카테고리의 할일이 없습니다.</p>
        )}
        {visibleTasks?.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onMoveToTomorrow={handleMoveToTomorrow}
            onUpdate={handleUpdate}
            categories={categories}
            disabled={isMutating}
          />
        ))}
        {incompleteCount > 0 && (
          <Button variant="outline" disabled={isMutating} onClick={handleCarryOver}>
            {activeFilter === null ? '' : '전체 '}미완료 {incompleteCount}개 다음 날로 이월
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t pt-6">
        <h2 className="text-sm font-medium text-muted-foreground">이 날의 루틴</h2>

        <AddRoutineForm onAdd={handleAddRoutine} disabled={createRoutine.isPending} />

        <div className="flex flex-col gap-2">
          {routinesQuery.isPending && (
            <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
          )}
          {routinesQuery.isError && (
            <p className="text-center text-sm text-destructive">루틴을 불러오지 못했습니다.</p>
          )}
          {routinesQuery.data?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">이 날은 루틴이 없습니다.</p>
          )}
          {routinesQuery.data?.map((routine) => (
            <RoutineItem
              key={routine.id}
              routine={routine}
              onToggle={handleToggleRoutine}
              onDelete={handleDeleteRoutine}
              disabled={isRoutineMutating}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-6">
        <h2 className="text-sm font-medium text-muted-foreground">이 날의 이벤트</h2>

        <div className="flex flex-col gap-2">
          {eventsQuery.isPending && (
            <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
          )}
          {eventsQuery.isError && (
            <p className="text-center text-sm text-destructive">이벤트를 불러오지 못했습니다.</p>
          )}
          {todaysEvents?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">이 날은 이벤트가 없습니다.</p>
          )}
          {todaysEvents?.map((event) => (
            <div key={`${event.id}-${event.occurrenceDate}`} className="rounded-md border p-3">
              <p className="truncate">{event.title}</p>
              {(event.recurrence !== 'NONE' || event.memo) && (
                <p className="truncate text-sm text-muted-foreground">
                  {event.recurrence !== 'NONE' && RECURRENCE_LABELS[event.recurrence]}
                  {event.recurrence !== 'NONE' && event.memo && ' · '}
                  {event.memo}
                </p>
              )}
              <CategoryBadge category={event.category} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
