import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { DAY_LABELS, DAY_ORDER, type DayOfWeek } from './types'

interface AddRoutineFormProps {
  onAdd: (title: string, daysOfWeek: DayOfWeek[]) => void
  disabled?: boolean
}

export function AddRoutineForm({ onAdd, disabled }: AddRoutineFormProps) {
  const [title, setTitle] = useState('')
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || selectedDays.length === 0) return
    onAdd(trimmed, selectedDays)
    setTitle('')
    setSelectedDays([])
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="루틴을 입력하세요"
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !title.trim() || selectedDays.length === 0}
          aria-label="추가"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex gap-1">
        {DAY_ORDER.map((day) => (
          <button
            key={day}
            type="button"
            disabled={disabled}
            onClick={() => toggleDay(day)}
            className={cn(
              'flex size-8 items-center justify-center rounded-full border text-sm transition-colors',
              selectedDays.includes(day)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>
    </form>
  )
}
