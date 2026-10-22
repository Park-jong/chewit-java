import { useTheme } from '@/features/theme/ThemeProvider'
import { cn } from '@/lib/utils'
import { needsOutline, type DotBackground } from './color'
import type { CategorySummary } from './types'

interface CategoryDotProps {
  category: CategorySummary | null
  // true면 카테고리가 없을 때 점과 같은 크기의 투명한 자리를 둬 제목 시작 위치를 맞춘다.
  reserveSpace?: boolean
  // true면 옆에 카테고리 이름이 텍스트로 있는 경우로, 접근성 트리에서 숨긴다.
  decorative?: boolean
  // 점이 놓인 배경. 기본은 페이지 배경이고, 선택된 칩처럼 bg-primary 위에 놓이면 'primary'.
  against?: DotBackground
}

// 색 점. 배경과 3:1 미만으로 가까운 색(다크의 아주 어두운 색, 라이트의 아주 밝은 색)에만 진한 테두리를 준다.
// 색만으로 의미를 전달하지 않도록 이름을 title/aria-label로 노출한다.
export function CategoryDot({ category, reserveSpace = false, decorative = false, against = 'page' }:CategoryDotProps) {
  const { resolvedTheme } = useTheme()

  if (!category) {
    return reserveSpace ? (
      <span aria-hidden="true" data-testid="category-dot-placeholder" className="size-2 shrink-0" />
    ) : null
  }

  const outline = needsOutline(category.color, resolvedTheme === 'dark', against)
  // 링 색은 점이 아니라 놓인 배경과 대비돼야 한다. primary 배경 위에서는 글자색(primary-foreground) 계열을 쓴다.
  const ringClass =
    against === 'primary'
      ? outline
        ? 'ring-primary-foreground/60'
        : 'ring-primary-foreground/15'
      : outline
        ? 'ring-foreground/60'
        : 'ring-foreground/15'
  const className = cn('size-2 shrink-0 rounded-full ring-1 ring-inset', ringClass)

  if (decorative) {
    return <span aria-hidden="true" className={className} style={{ backgroundColor: category.color }} />
  }

  return (
    <span
      role="img"
      aria-label={category.name}
      title={category.name}
      className={className}
      style={{ backgroundColor: category.color }}
    />
  )
}
