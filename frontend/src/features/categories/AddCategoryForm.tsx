import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColorSwatches } from './ColorSwatches'
import { CATEGORY_COLORS, CATEGORY_NAME_MAX_LENGTH } from './types'

interface AddCategoryFormProps {
  onAdd: (name: string, color: string) => void
  disabled?: boolean
}

export function AddCategoryForm({ onAdd, disabled }: AddCategoryFormProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0].value)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, color)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="카테고리 이름을 입력하세요"
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          disabled={disabled}
        />
        <Button type="submit" size="icon" disabled={disabled || !name.trim()} aria-label="추가">
          <Plus className="size-4" />
        </Button>
      </div>
      <ColorSwatches value={color} onChange={setColor} disabled={disabled} />
    </form>
  )
}
