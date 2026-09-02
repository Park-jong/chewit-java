export interface DailyCount {
  date: string
  total: number
  completed: number
}

export interface TaskStats {
  total: number
  completed: number
  completionRate: number
  daily: DailyCount[]
}

export interface RoutineStats {
  expected: number
  completed: number
  completionRate: number
  daily: DailyCount[]
}

export interface ChecklistStats {
  totalChecklists: number
  totalItems: number
  completedItems: number
  completionRate: number
}

export interface EventStats {
  occurrences: number
}

export interface MonthlyStats {
  month: string
  taskStats: TaskStats
  routineStats: RoutineStats
  checklistStats: ChecklistStats
  eventStats: EventStats
}
