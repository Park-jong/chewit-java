import type { CategorySummary } from './types'

interface CategoryDotProps {
  category: CategorySummary | null
  // true면 카테고리가 없을 때 점과 같은 크기의 투명한 자리를 둬 제목 시작 위치를 맞춘다.
  reserveSpace?: boolean
}

// 월간 그리드 셀용 색 점. 색만으로 의미를 전달하지 않도록 이름을 title/aria-label로 노출한다.
export function CategoryDot({ category, reserveSpace = false }: CategoryDotProps) {
  if (!category) {
    return reserveSpace ? (
      <span aria-hidden="true" data-testid="category-dot-placeholder" className="size-2 shrink-0" />
    ) : null
  }

  return (
    <span
      role="img"
      aria-label={category.name}
      title={category.name}
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: category.color }}
    />
  )
}
