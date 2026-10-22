import { normalizeTime, toISODate } from '@/lib/date'
import { PRIORITY_LABELS, type Task } from '@/features/tasks/types'

export const REMINDER_SETTINGS_KEY = 'chewit_reminder_settings'
export const REMINDER_NOTIFIED_KEY = 'chewit_reminder_notified'

export const LEAD_MINUTES_OPTIONS = [0, 5, 10] as const
export type LeadMinutes = (typeof LEAD_MINUTES_OPTIONS)[number]

export const LEAD_LABELS: Record<LeadMinutes, string> = {
  0: '정각',
  5: '5분 전',
  10: '10분 전',
}

export interface ReminderSettings {
  enabled: boolean
  leadMinutes: LeadMinutes
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: false, leadMinutes: 0 }

export function isLeadMinutes(value: unknown): value is LeadMinutes {
  return LEAD_MINUTES_OPTIONS.some((option) => option === value)
}

export function readReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY)
    if (!raw) return DEFAULT_REMINDER_SETTINGS
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_REMINDER_SETTINGS
    const { enabled, leadMinutes } = parsed as Record<string, unknown>
    return {
      enabled: enabled === true,
      leadMinutes: isLeadMinutes(leadMinutes) ? leadMinutes : DEFAULT_REMINDER_SETTINGS.leadMinutes,
    }
  } catch {
    return DEFAULT_REMINDER_SETTINGS
  }
}

export function writeReminderSettings(settings: ReminderSettings) {
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // 저장에 실패해도 현재 세션(메모리 상태)에서는 설정이 유지된다.
  }
}

// 같은 날, 같은 Task, 같은 시작 시각이면 같은 키. 시간이 바뀌면 새 키가 되어 다시 알릴 수 있다.
export function reminderKey(task: Pick<Task, 'id' | 'date'>, startTime: string): string {
  return `${task.date}:${task.id}:${startTime}`
}

// 오늘 알린 키만 돌려준다. 저장된 날짜가 오늘이 아니거나 값이 잘못되면 빈 집합(= 지난 날짜 키 정리).
export function readNotifiedKeys(today: string): Set<string> {
  try {
    const raw = localStorage.getItem(REMINDER_NOTIFIED_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return new Set()
    const { date, keys } = parsed as Record<string, unknown>
    if (date !== today || !Array.isArray(keys)) return new Set()
    return new Set(keys.filter((key): key is string => typeof key === 'string'))
  } catch {
    return new Set()
  }
}

// 오늘 날짜 하나만 저장하므로 쓸 때마다 지난 날짜의 키는 자연스럽게 사라진다.
export function writeNotifiedKeys(today: string, keys: ReadonlySet<string>) {
  try {
    localStorage.setItem(REMINDER_NOTIFIED_KEY, JSON.stringify({ date: today, keys: [...keys] }))
  } catch {
    // 저장 실패 시에는 메모리의 집합만으로 현재 세션의 중복을 막는다.
  }
}

export interface DueReminder {
  key: string
  title: string
  body: string
}

function toMinutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
}

// 지금 알려야 할 Task를 계산한다. 분 단위로 비교한다.
//  - 오늘 날짜이고 시작 시간이 있으며 미완료인 Task만 대상
//  - [시작 - 미리 알림 시간, 시작] 구간(양 끝 포함)에 now가 있을 때만 알림. 시작 분이 지났으면 제외
//  - notified에 이미 있는 키는 제외
export function findDueReminders(
  tasks: readonly Task[],
  options: { now: Date; leadMinutes: LeadMinutes; notified: ReadonlySet<string> },
): DueReminder[] {
  const { now, leadMinutes, notified } = options
  const today = toISODate(now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const result: DueReminder[] = []

  for (const task of tasks) {
    if (task.done || task.date !== today) continue
    const startTime = normalizeTime(task.startTime)
    if (!startTime) continue
    const start = toMinutes(startTime)
    if (nowMinutes > start || nowMinutes < start - leadMinutes) continue
    const key = reminderKey(task, startTime)
    if (notified.has(key)) continue
    const priority = task.priority ? ` · 우선순위 ${PRIORITY_LABELS[task.priority]}` : ''
    result.push({ key, title: task.title, body: `${startTime}${priority}` })
  }
  return result
}
