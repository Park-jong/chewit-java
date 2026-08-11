import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChecklistItem } from './types'

interface ChecklistItemRowProps {
  item: ChecklistItem
  isFirst: boolean
  isLast: boolean
  onToggle: (itemId: number) => void
  onDelete: (itemId: number) => void
  onMoveUp: (itemId: number) => void
  onMoveDown: (itemId: number) => void
  disabled?: boolean
}

export function ChecklistItemRow({
  item,
  isFirst,
  isLast,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled,
}: ChecklistItemRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <Checkbox
        checked={item.checked}
        disabled={disabled}
        onCheckedChange={() => onToggle(item.id)}
      />
      <p className={cn('min-w-0 flex-1 truncate', item.checked && 'text-muted-foreground line-through')}>
        {item.content}
      </p>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled || isFirst}
        onClick={() => onMoveUp(item.id)}
        aria-label="위로 이동"
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled || isLast}
        onClick={() => onMoveDown(item.id)}
        aria-label="아래로 이동"
      >
        <ChevronDown className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => onDelete(item.id)}
        aria-label="삭제"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
