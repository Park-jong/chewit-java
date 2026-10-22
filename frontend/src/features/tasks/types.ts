import type { CategorySummary } from '@/features/categories/types'

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

export interface Task {
  id: number
  title: string
  memo: string | null
  date: string
  done: boolean
  createdAt: string
  category: CategorySummary | null
  priority: TaskPriority | null
  // 서버는 "HH:mm"으로 내려주지만 "HH:mm:ss"도 허용한다. 표시·입력 전에 normalizeTime으로 맞춘다.
  startTime: string | null
}

export interface CreateTaskRequest {
  title: string
  memo?: string
  date: string
  categoryId?: number | null
  priority?: TaskPriority | null
  startTime?: string | null
}

export interface UpdateTaskRequest {
  title: string
  memo?: string
  date: string
  categoryId: number | null
  // 전체 교체 계약: null이면 서버에서 해제되므로 항상 기존 값을 채워 보낸다
  priority: TaskPriority | null
  startTime: string | null
}

export interface CarryOverRequest {
  fromDate: string
  toDate: string
}

export interface CarryOverResponse {
  movedCount: number
  toDate: string
}
