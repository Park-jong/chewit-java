import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColorSwatches } from './ColorSwatches'
import { CategoryBadge } from './CategoryBadge'
import { CATEGORY_NAME_MAX_LENGTH, type Category } from './types'

interface CategoryRowProps {
  category: Category
  onUpdate: (id: number, name: string, color: string) => void
  onDelete: (category: Category) => void
  disabled?: boolean
}

export function CategoryRow({ category, onUpdate, onDelete, disabled }: CategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color)

  function startEditing() {
    setName(category.name)
    setColor(category.color)
    setIsEditing(true)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (trimmed !== category.name || color !== category.color) {
      onUpdate(category.id, trimmed, color)
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border p-3">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          aria-label="카테고리 이름"
          disabled={disabled}
        />
        <ColorSwatches value={color} onChange={setColor} disabled={disabled} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
            취소
          </Button>
          <Button type="submit" disabled={disabled || !name.trim()}>
            저장
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="min-w-0 flex-1 text-sm">
        <CategoryBadge category={category} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={startEditing}
        aria-label="수정"
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => onDelete(category)}
        aria-label="삭제"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
