export interface Category {
  id: number
  name: string
  color: string
  createdAt: string
}

export interface CategorySummary {
  id: number
  name: string
  color: string
}

export interface CreateCategoryRequest {
  name: string
  color: string
}

export interface UpdateCategoryRequest {
  name: string
  color: string
}

export const CATEGORY_NAME_MAX_LENGTH = 30

export interface CategoryColorOption {
  value: string
  label: string
}

export const CATEGORY_COLORS: CategoryColorOption[] = [
  { value: '#3B82F6', label: '파랑' },
  { value: '#22C55E', label: '초록' },
  { value: '#EF4444', label: '빨강' },
  { value: '#F59E0B', label: '주황' },
  { value: '#8B5CF6', label: '보라' },
  { value: '#EC4899', label: '분홍' },
  { value: '#14B8A6', label: '청록' },
  { value: '#6B7280', label: '회색' },
]
