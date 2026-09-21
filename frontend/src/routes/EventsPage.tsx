import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useCreateEventMutation,
  useDeleteEventMutation,
  useEventsQuery,
} from '@/features/events/hooks'
import { EventItem } from '@/features/events/EventItem'
import { AddEventForm } from '@/features/events/AddEventForm'
import { useCategoriesQuery } from '@/features/categories/hooks'
import type { Event, RecurrenceType } from '@/features/events/types'
import {
  addMonthsISO,
  formatDisplayDate,
  formatDisplayMonth,
  todayISO,
  todayYearMonth,
} from '@/lib/date'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const MAX_VISIBLE_EVENTS = 3

function buildMonthGrid(month: string): (string | null)[] {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstDayOfWeek = new Date(year, monthNumber - 1, 1).getDay()
  const daysInMonth = new Date(year, monthNumber, 0).getDate()

  const cells: (string | null)[] = Array.from({ length: firstDayOfWeek }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }
  return cells
}

function groupEventsByDate(events: Event[] | undefined): Map<string, Event[]> {
  const map = new Map<string, Event[]>()
  for (const event of events ?? []) {
    const list = map.get(event.occurrenceDate) ?? []
    list.push(event)
    map.set(event.occurrenceDate, list)
  }
  return map
}

export function EventsPage() {
  const { user, logout } = useAuth()
  const [month, setMonth] = useState(todayYearMonth())
  const [selectedDate, setSelectedDate] = useState(todayISO())

  const eventsQuery = useEventsQuery(month)
  const categoriesQuery = useCategoriesQuery()
  const createEvent = useCreateEventMutation()
  const deleteEvent = useDeleteEventMutation()

  const isMutating = createEvent.isPending || deleteEvent.isPending
  const eventsByDate = groupEventsByDate(eventsQuery.data)
  const cells = buildMonthGrid(month)
  const today = todayISO()
  const selectedEvents = eventsByDate.get(selectedDate) ?? []

  function handleSelectMonth(nextMonth: string) {
    setMonth(nextMonth)
    if (!selectedDate.startsWith(nextMonth)) {
      setSelectedDate(`${nextMonth}-01`)
    }
  }

  function handleAdd(
    title: string,
    date: string,
    recurrence: RecurrenceType,
    categoryId: number | null,
  ) {
    createEvent.mutate(
      { title, date, recurrence, categoryId },
      {
        onSuccess: () => setSelectedDate(date),
        onError: (error) => toast.error(getErrorMessage(error, '이벤트 추가에 실패했습니다.')),
      },
    )
  }

  function handleDelete(id: number) {
    deleteEvent.mutate(id, {
      onError: (error) => toast.error(getErrorMessage(error, '삭제에 실패했습니다.')),
    })
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-6">
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
        <Button variant="ghost" size="icon" onClick={() => handleSelectMonth(addMonthsISO(month, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium">{formatDisplayMonth(month)}</span>
          {month !== todayYearMonth() && (
            <button
              type="button"
              className="text-xs text-primary underline underline-offset-4"
              onClick={() => handleSelectMonth(todayYearMonth())}
            >
              이번 달로 이동
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => handleSelectMonth(addMonthsISO(month, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {eventsQuery.isPending && (
        <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {eventsQuery.isError && (
        <p className="text-center text-sm text-destructive">이벤트를 불러오지 못했습니다.</p>
      )}

      {eventsQuery.data && (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border text-sm">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
              {label}
            </div>
          ))}
          {cells.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="min-h-24 bg-background" />
            }
            const dayEvents = eventsByDate.get(date) ?? []
            const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS)
            const remaining = dayEvents.length - visibleEvents.length
            const dayNumber = Number(date.slice(-2))

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                aria-current={date === selectedDate ? 'date' : undefined}
                className={cn(
                  'flex min-h-24 flex-col gap-1 bg-background p-2 text-left hover:bg-muted/50',
                  date === selectedDate && 'ring-2 ring-inset ring-primary',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium',
                    date === today &&
                      'flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground',
                  )}
                >
                  {dayNumber}
                </span>
                <div className="flex flex-col gap-0.5">
                  {visibleEvents.map((event) => (
                    <span key={event.id} className="truncate text-xs">
                      {event.title}
                    </span>
                  ))}
                  {remaining > 0 && (
                    <Badge variant="secondary" className="w-fit text-[10px]">
                      +{remaining}개 더
                    </Badge>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-md border p-4">
        <h2 className="text-sm font-medium">{formatDisplayDate(selectedDate)}</h2>

        <AddEventForm
          key={selectedDate}
          onAdd={handleAdd}
          defaultDate={selectedDate}
          categories={categoriesQuery.data ?? []}
          disabled={createEvent.isPending}
        />

        <div className="flex flex-col gap-2">
          {selectedEvents.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">이 날은 이벤트가 없습니다.</p>
          )}
          {selectedEvents.map((event) => (
            <EventItem
              key={`${event.id}-${event.occurrenceDate}`}
              event={event}
              onDelete={handleDelete}
              disabled={isMutating}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
