import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryBadge } from '@/features/categories/CategoryBadge'
import { formatMonthDay } from '@/lib/date'
import { RECURRENCE_LABELS, type Event } from './types'

interface EventItemProps {
  event: Event
  onDelete: (id: number) => void
  onDeleteOccurrence?: (id: number, occurrenceDate: string) => void
  onUpdateOccurrence?: (
    id: number,
    occurrenceDate: string,
    request: { title: string; memo?: string },
  ) => void
  disabled?: boolean
}

export function EventItem({
  event,
  onDelete,
  onDeleteOccurrence,
  onUpdateOccurrence,
  disabled,
}: EventItemProps) {
  const [choosingDelete, setChoosingDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [memo, setMemo] = useState(event.memo ?? '')

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
