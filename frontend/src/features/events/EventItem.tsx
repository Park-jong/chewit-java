import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryBadge } from '@/features/categories/CategoryBadge'
import { CategorySelect } from '@/features/categories/CategorySelect'
import type { Category } from '@/features/categories/types'
import { formatMonthDay } from '@/lib/date'
import {
  RECURRENCE_LABELS,
  RECURRENCE_ORDER,
  type Event,
  type RecurrenceType,
  type UpdateEventRequest,
} from './types'

interface EventItemProps {
  event: Event
  onDelete: (id: number) => void
  onDeleteOccurrence?: (id: number, occurrenceDate: string) => void
  onUpdateOccurrence?: (
    id: number,
    occurrenceDate: string,
    request: { title: string; memo?: string },
  ) => void
  onUpdateSeries?: (id: number, request: UpdateEventRequest) => void
  categories?: Category[]
  disabled?: boolean
}

export function EventItem({
  event,
  onDelete,
  onDeleteOccurrence,
  onUpdateOccurrence,
  onUpdateSeries,
  categories = [],
  disabled,
}: EventItemProps) {
  const [choosingDelete, setChoosingDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [memo, setMemo] = useState(event.memo ?? '')
  // 시리즈 수정은 회차가 아닌 시리즈 원본(date=앵커, recurrence)을 대상으로 한다.
  const [editingSeries, setEditingSeries] = useState(false)
  const [seriesTitle, setSeriesTitle] = useState(event.seriesTitle)
  const [seriesMemo, setSeriesMemo] = useState(event.seriesMemo ?? '')
  const [seriesDate, setSeriesDate] = useState(event.date)
  const [seriesRecurrence, setSeriesRecurrence] = useState<RecurrenceType>(event.recurrence)
  const [seriesCategoryId, setSeriesCategoryId] = useState<number | null>(event.category?.id ?? null)

  const isRecurring = event.recurrence !== 'NONE'

  function handleDeleteClick() {
    if (isRecurring && onDeleteOccurrence) {
      setChoosingDelete(true)
      return
    }
    onDelete(event.id)
  }

  function handleSaveOccurrence() {
    const trimmed = title.trim()
    if (!trimmed || !onUpdateOccurrence) return
    const trimmedMemo = memo.trim()
    onUpdateOccurrence(event.id, event.occurrenceDate, {
      title: trimmed,
      memo: trimmedMemo ? trimmedMemo : undefined,
    })
    setEditing(false)
  }

  function startEditingSeries() {
    setSeriesTitle(event.seriesTitle)
    setSeriesMemo(event.seriesMemo ?? '')
    setSeriesDate(event.date)
    setSeriesRecurrence(event.recurrence)
    setSeriesCategoryId(event.category?.id ?? null)
    setEditingSeries(true)
  }

  function handleSaveSeries() {
    const trimmed = seriesTitle.trim()
    if (!trimmed || !seriesDate || !onUpdateSeries) return
    const trimmedMemo = seriesMemo.trim()
    // PATCH는 전체 교체 계약이므로 categoryId는 null(해제)이어도 항상 전송한다.
    onUpdateSeries(event.id, {
      title: trimmed,
      memo: trimmedMemo ? trimmedMemo : undefined,
      date: seriesDate,
      recurrence: seriesRecurrence,
      categoryId: seriesCategoryId,
    })
    setEditingSeries(false)
  }

  if (editingSeries) {
    // 앵커 날짜/반복 규칙이 바뀌면 백엔드가 회차별 수정(override)을 모두 초기화한다.
    const resetsOverrides =
      isRecurring && (seriesDate !== event.date || seriesRecurrence !== event.recurrence)
    return (
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <p className="text-xs text-muted-foreground">
          {isRecurring ? '시리즈 전체 수정' : '이벤트 수정'}
        </p>
        <Input
          value={seriesTitle}
          onChange={(e) => setSeriesTitle(e.target.value)}
          placeholder="제목"
          aria-label="시리즈 제목"
        />
        <Input
          value={seriesMemo}
          onChange={(e) => setSeriesMemo(e.target.value)}
          placeholder="메모"
          aria-label="시리즈 메모"
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={seriesDate}
            onChange={(e) => setSeriesDate(e.target.value)}
            aria-label="시리즈 시작 날짜"
            className="flex-1"
          />
          <select
            aria-label="반복"
            value={seriesRecurrence}
            onChange={(e) => setSeriesRecurrence(e.target.value as RecurrenceType)}
            className="rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            {RECURRENCE_ORDER.map((option) => (
              <option key={option} value={option}>
                {RECURRENCE_LABELS[option]}
              </option>
            ))}
          </select>
          <CategorySelect
            categories={categories}
            value={seriesCategoryId}
            onChange={setSeriesCategoryId}
          />
        </div>
        {resetsOverrides && (
          <p className="text-xs text-muted-foreground">
            날짜나 반복 규칙을 바꾸면 &quot;이 일정만&quot; 수정·삭제한 내용이 모두 초기화됩니다.
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={disabled || !seriesTitle.trim() || !seriesDate}
            onClick={handleSaveSeries}
          >
            {isRecurring ? '시리즈 저장' : '저장'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditingSeries(false)}>
            취소
          </Button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <p className="text-xs text-muted-foreground">
          이 일정만 수정 ({formatMonthDay(event.occurrenceDate)})
        </p>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          aria-label="이 일정 제목"
        />
        <Input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모"
          aria-label="이 일정 메모"
        />
        <div className="flex gap-2">
          <Button size="sm" disabled={disabled || !title.trim()} onClick={handleSaveOccurrence}>
            이 일정만 저장
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            취소
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate">
          {event.title}
          {event.overridden && (
            <Badge variant="secondary" className="ml-2">
              수정됨
            </Badge>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {formatMonthDay(event.occurrenceDate)}
          {isRecurring && ` · ${RECURRENCE_LABELS[event.recurrence]}`}
          {event.memo && ` · ${event.memo}`}
        </p>
        <CategoryBadge category={event.category} />
      </div>
      {choosingDelete ? (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => {
              setChoosingDelete(false)
              onDeleteOccurrence?.(event.id, event.occurrenceDate)
            }}
          >
            이 일정만 삭제
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={disabled}
            onClick={() => {
              setChoosingDelete(false)
              onDelete(event.id)
            }}
          >
            모든 반복 삭제
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setChoosingDelete(false)}>
            취소
          </Button>
        </div>
      ) : (
        <>
          {isRecurring && onUpdateOccurrence && (
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => {
                setTitle(event.title)
                setMemo(event.memo ?? '')
                setEditing(true)
              }}
              aria-label="이 일정만 수정"
            >
              <Pencil className="size-4" />
            </Button>
          )}
          {onUpdateSeries && (
            <Button
              variant="ghost"
              size={isRecurring ? 'sm' : 'icon'}
              disabled={disabled}
              onClick={startEditingSeries}
              aria-label={isRecurring ? '시리즈 수정' : '수정'}
            >
              {isRecurring ? '시리즈 수정' : <Pencil className="size-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={handleDeleteClick}
            aria-label="삭제"
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </div>
  )
}
