export interface CalendarTaskItem {
  id: number
  title: string
  done: boolean
}

export interface CalendarRoutineItem {
  id: number
  title: string
  done: boolean
}

export interface CalendarEventItem {
  id: number
  title: string
}

export interface CalendarDay {
  date: string
  tasks: CalendarTaskItem[]
  routines: CalendarRoutineItem[]
  events: CalendarEventItem[]
}

export interface CalendarMonth {
  month: string
  days: CalendarDay[]
}
