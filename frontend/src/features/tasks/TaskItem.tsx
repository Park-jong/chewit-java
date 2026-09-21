import { CalendarArrowUp, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/features/categories/CategoryBadge'
import { cn } from '@/lib/utils'
import type { Task } from './types'

interface TaskItemProps {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onMoveToTomorrow: (task: Task) => void
  disabled?: boolean
}

export function TaskItem({ task, onToggle, onDelete, onMoveToTomorrow, disabled }: TaskItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox
        checked={task.done}
        disabled={disabled}
        onCheckedChange={() => onToggle(task.id)}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate', task.done && 'text-muted-foreground line-through')}>
          {task.title}
        </p>
        {task.memo && (
          <p className="truncate text-sm text-muted-foreground">{task.memo}</p>
        )}
        <CategoryBadge category={task.category} />
      </div>
      {!task.done && (
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onMoveToTomorrow(task)}
          aria-label="내일로 이월"
        >
          <CalendarArrowUp className="size-4" />
          내일로
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => onDelete(task.id)}
        aria-label="삭제"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
