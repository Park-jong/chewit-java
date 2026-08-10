export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export const DAY_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
  SUNDAY: '일',
}

export interface Routine {
  id: number
  title: string
  memo: string | null
  daysOfWeek: DayOfWeek[]
  active: boolean
  done: boolean
  createdAt: string
}

export interface CreateRoutineRequest {
  title: string
  memo?: string
  daysOfWeek: DayOfWeek[]
}

export interface UpdateRoutineRequest {
  title: string
  memo?: string
  daysOfWeek: DayOfWeek[]
  active: boolean
}
