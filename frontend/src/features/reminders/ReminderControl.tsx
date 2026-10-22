import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LEAD_LABELS, LEAD_MINUTES_OPTIONS, isLeadMinutes } from './reminder'
import { useReminder } from './ReminderProvider'

// 알림 켜기/끄기 버튼과 미리 알림 시간 선택. Notification API가 없으면 아무것도 그리지 않는다.
export function ReminderControl() {
  const { supported, enabled, leadMinutes, setEnabled, setLeadMinutes } = useReminder()
  if (!supported) return null

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 gap-1.5 text-xs text-muted-foreground"
        aria-label={enabled ? '알림 끄기' : '알림 켜기'}
        aria-pressed={enabled}
        title={enabled ? '시작 시간 알림이 켜져 있습니다' : '시작 시간 알림을 켭니다'}
        onClick={() => void setEnabled(!enabled)}
      >
        {enabled ? <Bell className="size-3.5" aria-hidden="true" /> : <BellOff className="size-3.5" aria-hidden="true" />}
        <span className="hidden sm:inline">알림</span>
      </Button>
      {enabled && (
        <select
          aria-label="미리 알림 시간"
          value={leadMinutes}
          onChange={(event) => {
            const value = Number(event.target.value)
            if (isLeadMinutes(value)) setLeadMinutes(value)
          }}
          className="h-7 shrink-0 rounded-md border border-input bg-background px-1 text-xs text-foreground"
        >
          {LEAD_MINUTES_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {LEAD_LABELS[option]}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
