import { Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DAY_LABELS, DAY_ORDER, type Routine } from './types'

interface RoutineItemProps {
  routine: Routine
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  disabled?: boolean
}

function formatDays(routine: Routine): string {
  return DAY_ORDER.filter((day) => routine.daysOfWeek.includes(day))
    .map((day) => DAY_LABELS[day])
    .join(', ')
}

export function RoutineItem({ routine, onToggle, onDelete, disabled }: RoutineItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox
        checked={routine.done}
        disabled={disabled}
        onCheckedChange={() => onToggle(routine.id)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className={cn('truncate', routine.done && 'text-muted-foreground line-through')}>
            {routine.title}
          </p>
          <Badge variant="secondary">{Math.round(routine.completionRate * 100)}%</Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {formatDays(routine)}
          {routine.memo && ` · ${routine.memo}`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => onDelete(routine.id)}
        aria-label="삭제"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
