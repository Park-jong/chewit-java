import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddChecklistFormProps {
  onAdd: (title: string) => void
  disabled?: boolean
}

export function AddChecklistForm({ onAdd, disabled }: AddChecklistFormProps) {
  const [title, setTitle] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="체크리스트 이름을 입력하세요"
        disabled={disabled}
      />
      <Button type="submit" size="icon" disabled={disabled || !title.trim()} aria-label="추가">
        <Plus className="size-4" />
      </Button>
    </form>
  )
}
