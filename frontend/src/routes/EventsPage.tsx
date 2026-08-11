import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useCreateEventMutation,
  useDeleteEventMutation,
  useEventsQuery,
} from '@/features/events/hooks'
import { EventItem } from '@/features/events/EventItem'
import { AddEventForm } from '@/features/events/AddEventForm'
import type { RecurrenceType } from '@/features/events/types'
import { addMonthsISO, formatDisplayMonth, todayISO, todayYearMonth } from '@/lib/date'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'

export function EventsPage() {
  const { user, logout } = useAuth()
  const [month, setMonth] = useState(todayYearMonth())

  const eventsQuery = useEventsQuery(month)
  const createEvent = useCreateEventMutation()
  const deleteEvent = useDeleteEventMutation()

  const isMutating = createEvent.isPending || deleteEvent.isPending

  function handleAdd(title: string, date: string, recurrence: RecurrenceType) {
    createEvent.mutate(
      { title, date, recurrence },
      { onError: (error) => toast.error(getErrorMessage(error, '이벤트 추가에 실패했습니다.')) },
    )
  }

  function handleDelete(id: number) {
    deleteEvent.mutate(id, {
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

      <Link to="/" className="text-sm text-primary underline underline-offset-4">
        오늘 화면으로
      </Link>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonthsISO(m, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium">{formatDisplayMonth(month)}</span>
          {month !== todayYearMonth() && (
            <button
              type="button"
              className="text-xs text-primary underline underline-offset-4"
              onClick={() => setMonth(todayYearMonth())}
            >
              이번 달로 이동
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonthsISO(m, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <AddEventForm
        onAdd={handleAdd}
        defaultDate={month === todayYearMonth() ? todayISO() : `${month}-01`}
        disabled={createEvent.isPending}
      />

      <div className="flex flex-col gap-2">
        {eventsQuery.isPending && (
          <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {eventsQuery.isError && (
          <p className="text-center text-sm text-destructive">이벤트를 불러오지 못했습니다.</p>
        )}
        {eventsQuery.data?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">이 달은 이벤트가 없습니다.</p>
        )}
        {eventsQuery.data?.map((event) => (
          <EventItem
            key={`${event.id}-${event.occurrenceDate}`}
            event={event}
            onDelete={handleDelete}
            disabled={isMutating}
          />
        ))}
      </div>
    </div>
  )
}
