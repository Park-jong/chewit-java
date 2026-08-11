function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function addDaysISO(iso: string, delta: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + delta)
  return toISODate(date)
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function formatDisplayDate(iso: string): string {
  const date = parseISODate(iso)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`
}

export function formatMonthDay(iso: string): string {
  const date = parseISODate(iso)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`
}

export function todayYearMonth(): string {
  const today = todayISO()
  return today.slice(0, 7)
}

export function addMonthsISO(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function formatDisplayMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return `${year}년 ${month}월`
}
