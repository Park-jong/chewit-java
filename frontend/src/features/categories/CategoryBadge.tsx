import { CategoryDot } from './CategoryDot'
import type { CategorySummary } from './types'

interface CategoryBadgeProps {
  category: CategorySummary | null
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) return null

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground">
      <CategoryDot category={category} decorative />
      <span className="truncate">{category.name}</span>
    </span>
  )
}
