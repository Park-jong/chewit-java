import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategorySelect } from '@/features/categories/CategorySelect'
import type { Category } from '@/features/categories/types'
import { PrioritySelect } from './PrioritySelect'
import type { TaskPriority } from './types'

export interface NewTaskInput {
  title: string
  categoryId: number | null
  priority: TaskPriority | null
  startTime: string | null
}

interface AddTaskFormProps {
  onAdd: (task: NewTaskInput) => void
  categories: Category[]
  disabled?: boolean
}

export function AddTaskForm({ onAdd, categories, disabled }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [priority, setPriority] = useState<TaskPriority | null>(null)
  const [startTime, setStartTime] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd({ title: trimmed, categoryId, priority, startTime: startTime || null })
    setTitle('')
    setStartTime('')
    setPriority(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="할 일을 입력하세요"
          disabled={disabled}
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="icon" disabled={disabled || !title.trim()} aria-label="추가">
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          aria-label="시간"
          disabled={disabled}
          className="w-auto"
        />
        <PrioritySelect value={priority} onChange={setPriority} disabled={disabled} />
        <CategorySelect
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          disabled={disabled}
        />
      </div>
    </form>
  )
}
