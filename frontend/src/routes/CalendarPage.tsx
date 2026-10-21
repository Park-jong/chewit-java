import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/features/auth/AuthContext'
import { useCalendarQuery } from '@/features/calendar/hooks'
import type { CalendarDay } from '@/features/calendar/types'
import { CategoryDot } from '@/features/categories/CategoryDot'
import type { CategorySummary } from '@/features/categories/types'
import { addMonthsISO, formatDisplayMonth, todayISO, todayYearMonth } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const MAX_VISIBLE_ITEMS = 3

interface CalendarItem {
  key: string
  label: string
  muted: boolean
  category: CategorySummary | null
}

function toCalendarItems(day: CalendarDay | undefined): CalendarItem[] {
  if (!day) {
    return []
  }
  return [
    ...day.tasks.map((task) => ({
      key: `task-${task.id}`,
      label: task.title,
      muted: task.done,
      category: task.category,
    })),
    ...day.routines.map((routine) => ({
      key: `routine-${routine.id}`,
      label: routine.title,
      muted: routine.done,
      category: null,
    })),
    ...day.events.map((event) => ({
      key: `event-${event.id}`,
      label: event.title,
      muted: false,
      category: event.category,
    })),
  ]
}

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

export function CalendarPage() {
  const { user, logout } = useAuth()
  const [month, setMonth] = useState(todayYearMonth())

  const calendarQuery = useCalendarQuery(month)
  const daysByDate = new Map((calendarQuery.data?.days ?? []).map((day) => [day.date, day]))
  const cells = buildMonthGrid(month)
  const today = todayISO()

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

      {calendarQuery.isPending && (
        <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {calendarQuery.isError && (
        <p className="text-center text-sm text-destructive">달력을 불러오지 못했습니다.</p>
      )}

      {calendarQuery.data && (
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
            const items = toCalendarItems(daysByDate.get(date))
            const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS)
            const remaining = items.length - visibleItems.length
            const dayNumber = Number(date.slice(-2))

            return (
              <div key={date} className="flex min-h-24 flex-col gap-1 bg-background p-2">
                <span
                  className={cn(
                    'text-xs font-medium',
                    date === today && 'flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground',
                  )}
                >
                  {dayNumber}
                </span>
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => (
                    <span key={item.key} className="flex items-center gap-1">
                      <CategoryDot category={item.category} reserveSpace />
                      <span
                        className={cn(
                          'truncate text-xs',
                          item.muted && 'text-muted-foreground line-through',
                        )}
                      >
                        {item.label}
                      </span>
                    </span>
                  ))}
                  {remaining > 0 && (
                    <Badge variant="secondary" className="w-fit text-[10px]">
                      +{remaining}개 더
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
