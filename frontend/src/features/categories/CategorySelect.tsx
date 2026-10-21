import type { Category } from './types'

interface CategorySelectProps {
  categories: Category[]
  value: number | null
  onChange: (categoryId: number | null) => void
  disabled?: boolean
  className?: string
  // value가 null일 때의 선택지 문구 (필터 용도로는 "전체" 등으로 바꾼다)
  emptyLabel?: string
}

const NO_CATEGORY_VALUE = ''

// 선택할 카테고리가 하나도 없으면 "카테고리 없음"만 있는 셀렉트가 무의미하므로 렌더링하지 않는다.
export function CategorySelect({ categories, value, onChange, disabled, className, emptyLabel = '카테고리 없음' }: CategorySelectProps) {
  if (categories.length === 0) return null

  return (
    <select
      aria-label="카테고리"
      value={value === null ? NO_CATEGORY_VALUE : String(value)}
      onChange={(event) =>
        onChange(event.target.value === NO_CATEGORY_VALUE ? null : Number(event.target.value))
      }
      disabled={disabled}
      className={
        className ?? 'rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs'
      }
    >
      <option value={NO_CATEGORY_VALUE}>{emptyLabel}</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  )
}
