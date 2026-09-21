import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategorySelect } from '@/features/categories/CategorySelect'
import type { Category } from '@/features/categories/types'
import { RECURRENCE_LABELS, RECURRENCE_ORDER, type RecurrenceType } from './types'

interface AddEventFormProps {
  onAdd: (title: string, date: string, recurrence: RecurrenceType, categoryId: number | null) => void
  defaultDate: string
  categories: Category[]
  disabled?: boolean
}

export function AddEventForm({ onAdd, defaultDate, categories, disabled }: AddEventFormProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [recurrence, setRecurrence] = useState<RecurrenceType>('NONE')
  const [categoryId, setCategoryId] = useState<number | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || !date) return
    onAdd(trimmed, date, recurrence, categoryId)
    setTitle('')
    setRecurrence('NONE')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="이벤트를 입력하세요"
        disabled={disabled}
      />
      <div className="flex gap-2">
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <select
          value={recurrence}
          onChange={(event) => setRecurrence(event.target.value as RecurrenceType)}
          disabled={disabled}
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
          value={categoryId}
          onChange={setCategoryId}
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !title.trim() || !date}
          aria-label="추가"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </form>
  )
}
