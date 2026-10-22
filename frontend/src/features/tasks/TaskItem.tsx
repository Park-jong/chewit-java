import { useState } from 'react'
import { CalendarArrowUp, Pencil, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CategoryBadge } from '@/features/categories/CategoryBadge'
import { CategorySelect } from '@/features/categories/CategorySelect'
import type { Category } from '@/features/categories/types'
import { normalizeTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PrioritySelect } from './PrioritySelect'
import { PRIORITY_LABELS, type Task, type TaskPriority, type UpdateTaskRequest } from './types'

interface TaskItemProps {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onMoveToTomorrow: (task: Task) => void
  onUpdate?: (id: number, request: UpdateTaskRequest) => void
  categories?: Category[]
  disabled?: boolean
}

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onMoveToTomorrow,
  onUpdate,
  categories = [],
  disabled,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [memo, setMemo] = useState(task.memo ?? '')
  const [date, setDate] = useState(task.date)
  const [categoryId, setCategoryId] = useState<number | null>(task.category?.id ?? null)
  const [priority, setPriority] = useState<TaskPriority | null>(task.priority)
  const [startTime, setStartTime] = useState(normalizeTime(task.startTime) ?? '')

  function startEditing() {
    setTitle(task.title)
    setMemo(task.memo ?? '')
    setDate(task.date)
    setCategoryId(task.category?.id ?? null)
    setPriority(task.priority)
    setStartTime(normalizeTime(task.startTime) ?? '')
    setEditing(true)
  }

  function handleSave() {
    const trimmed = title.trim()
    if (!trimmed || !date || !onUpdate) return
    const trimmedMemo = memo.trim()
    // PATCH는 전체 교체 계약이므로 categoryId·priority·startTime은 null(해제)이어도 항상 전송한다. done은 건드리지 않는다.
    onUpdate(task.id, {
      title: trimmed,
      memo: trimmedMemo ? trimmedMemo : undefined,
      date,
      categoryId,
      priority,
      startTime: startTime || null,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          aria-label="할일 제목"
        />
        <Input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모"
          aria-label="할일 메모"
        />
        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="할일 날짜"
            className="flex-1"
          />
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            aria-label="할일 시간"
            className="w-auto"
          />
          <PrioritySelect value={priority} onChange={setPriority} label="할일 우선순위" />
          <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={disabled || !title.trim() || !date} onClick={handleSave}>
            저장
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            취소
          </Button>
        </div>
      </div>
    )
  }

  const displayTime = normalizeTime(task.startTime)

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox
        checked={task.done}
        disabled={disabled}
        onCheckedChange={() => onToggle(task.id)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {displayTime && (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{displayTime}</span>
          )}
          <p className={cn('truncate', task.done && 'text-muted-foreground line-through')}>
            {task.title}
          </p>
          {task.priority && (
            <Badge variant={task.priority === 'HIGH' ? 'destructive' : 'outline'}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
          )}
        </div>
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
      {onUpdate && (
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={startEditing}
          aria-label="수정"
        >
          <Pencil className="size-4" />
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
