import { Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task } from './types'

interface TaskItemProps {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  disabled?: boolean
}

export function TaskItem({ task, onToggle, onDelete, disabled }: TaskItemProps) {
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
      </div>
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
