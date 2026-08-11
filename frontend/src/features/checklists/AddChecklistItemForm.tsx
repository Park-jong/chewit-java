import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddChecklistItemFormProps {
  onAdd: (content: string) => void
  disabled?: boolean
}

export function AddChecklistItemForm({ onAdd, disabled }: AddChecklistItemFormProps) {
  const [content, setContent] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="항목을 입력하세요"
        disabled={disabled}
      />
      <Button type="submit" size="icon" disabled={disabled || !content.trim()} aria-label="추가">
        <Plus className="size-4" />
      </Button>
    </form>
  )
}
