import { useRef, type DragEvent } from 'react'
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChecklistItem } from './types'

interface ChecklistItemRowProps {
  item: ChecklistItem
  isFirst: boolean
  isLast: boolean
  isDragging: boolean
  isDragOver: boolean
  onToggle: (itemId: number) => void
  onDelete: (itemId: number) => void
  onMoveUp: (itemId: number) => void
  onMoveDown: (itemId: number) => void
  onDragStart: (itemId: number) => void
  onDragOverItem: (itemId: number) => void
  onDrop: (itemId: number) => void
  onDragEnd: () => void
  disabled?: boolean
}

export function ChecklistItemRow({
  item,
  isFirst,
  isLast,
  isDragging,
  isDragOver,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOverItem,
  onDrop,
  onDragEnd,
  disabled,
}: ChecklistItemRowProps) {
  const handleRef = useRef<HTMLButtonElement>(null)
  const allowDragRef = useRef(false)

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    if (!allowDragRef.current) {
      event.preventDefault()
      return
    }
    onDragStart(item.id)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    onDragOverItem(item.id)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    onDrop(item.id)
  }

  function handleDragEnd() {
    allowDragRef.current = false
    onDragEnd()
  }

  function handleMouseUp() {
    allowDragRef.current = false
  }

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onMouseUp={handleMouseUp}
      className={cn(
        'flex items-center gap-2 rounded-md border p-3 transition-colors',
        isDragging && 'opacity-50',
        isDragOver && 'border-primary',
      )}
    >
      <button
        ref={handleRef}
        type="button"
        disabled={disabled}
        onMouseDown={() => {
          allowDragRef.current = true
        }}
        className="cursor-grab touch-none text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="순서 변경 핸들"
      >
        <GripVertical className="size-4" />
      </button>
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
