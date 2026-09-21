import { cn } from '@/lib/utils'
import { CATEGORY_COLORS } from './types'

interface ColorSwatchesProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function ColorSwatches({ value, onChange, disabled }: ColorSwatchesProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="색상 선택">
      {CATEGORY_COLORS.map((color) => {
        const isSelected = color.value.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={color.value}
            type="button"
            aria-label={`${color.label} 색상`}
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onChange(color.value)}
            className={cn(
              'size-6 rounded-full border-2 border-transparent transition-shadow disabled:opacity-50',
              isSelected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
            )}
            style={{ backgroundColor: color.value }}
          />
        )
      })}
    </div>
  )
}
