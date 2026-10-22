import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { toISODate } from '@/lib/date'
import { useTasksQuery } from '@/features/tasks/hooks'
import {
  findDueReminders,
  readNotifiedKeys,
  readReminderSettings,
  writeNotifiedKeys,
  writeReminderSettings,
  type LeadMinutes,
  type ReminderSettings,
} from './reminder'

const TICK_MS = 30_000

function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

interface ReminderContextValue {
  supported: boolean
  enabled: boolean
  leadMinutes: LeadMinutes
  setEnabled: (enabled: boolean) => Promise<void>
  setLeadMinutes: (leadMinutes: LeadMinutes) => void
}

// Provider 밖(단독 렌더링되는 컴포넌트 테스트)에서도 안전하도록 기본값은 "미지원"으로 둔다.
const ReminderContext = createContext<ReminderContextValue>({
  supported: false,
  enabled: false,
  leadMinutes: 0,
  setEnabled: async () => {},
  setLeadMinutes: () => {},
})

// 로그인 상태에서만 렌더링한다(오늘 Task 조회가 인증을 요구하므로).
export function ReminderProvider({ children }: { children: ReactNode }) {
  const supported = isNotificationSupported()
  const [settings, setSettings] = useState<ReminderSettings>(readReminderSettings)
  const [now, setNow] = useState(() => new Date())
  const notifiedRef = useRef<{ date: string; keys: Set<string> } | null>(null)

  // 저장된 설정이 켜져 있어도 권한이 없으면 동작하지 않는다.
  const active = supported && settings.enabled && Notification.permission === 'granted'
  const today = toISODate(now)

  const { data: tasks } = useTasksQuery(today, { enabled: active })

  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(timer)
  }, [active])

  useEffect(() => {
    if (!active || !tasks) return
    if (notifiedRef.current?.date !== today) {
      notifiedRef.current = { date: today, keys: readNotifiedKeys(today) }
    }
    const notified = notifiedRef.current.keys
    const due = findDueReminders(tasks, { now, leadMinutes: settings.leadMinutes, notified })
    if (due.length === 0) return
    for (const reminder of due) {
      notified.add(reminder.key)
      try {
        new Notification(reminder.title, { body: reminder.body, tag: reminder.key })
      } catch {
        // 알림 생성 실패는 조용히 무시한다. 다음 틱에 중복 시도하지 않도록 키는 이미 기록했다.
      }
    }
    writeNotifiedKeys(today, notified)
  }, [active, tasks, now, today, settings.leadMinutes])

  const update = useCallback((next: ReminderSettings) => {
    setSettings(next)
    writeReminderSettings(next)
  }, [])

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        update({ ...settings, enabled: false })
        return
      }
      if (!isNotificationSupported()) {
        toast.error('이 브라우저는 알림을 지원하지 않습니다.')
        return
      }
      let permission: NotificationPermission = Notification.permission
      if (permission !== 'granted') {
        try {
          permission = await Notification.requestPermission()
        } catch {
          permission = 'denied'
        }
      }
      if (permission !== 'granted') {
        toast.error('알림 권한이 허용되지 않았습니다. 브라우저 설정에서 알림을 허용해 주세요.')
        return
      }
      setNow(new Date())
      update({ ...settings, enabled: true })
    },
    [settings, update],
  )

  const setLeadMinutes = useCallback(
    (leadMinutes: LeadMinutes) => update({ ...settings, leadMinutes }),
    [settings, update],
  )

  const value = useMemo(
    () => ({ supported, enabled: active, leadMinutes: settings.leadMinutes, setEnabled, setLeadMinutes }),
    [supported, active, settings.leadMinutes, setEnabled, setLeadMinutes],
  )

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReminder() {
  return useContext(ReminderContext)
}
