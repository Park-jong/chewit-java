import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/features/categories/CategoryBadge'
import { formatMonthDay } from '@/lib/date'
import { RECURRENCE_LABELS, type Event } from './types'

interface EventItemProps {
  event: Event
  onDelete: (id: number) => void
  disabled?: boolean
}

export function EventItem({ event, onDelete, disabled }: EventItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate">{event.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {formatMonthDay(event.occurrenceDate)}
          {event.recurrence !== 'NONE' && ` · ${RECURRENCE_LABELS[event.recurrence]}`}
          {event.memo && ` · ${event.memo}`}
        </p>
        <CategoryBadge category={event.category} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => onDelete(event.id)}
        aria-label="삭제"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
