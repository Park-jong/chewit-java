import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Task } from '@/features/tasks/types'
import { listTasks } from '@/features/tasks/api'
import { REMINDER_NOTIFIED_KEY, REMINDER_SETTINGS_KEY } from './reminder'
import { ReminderProvider } from './ReminderProvider'
import { ReminderControl } from './ReminderControl'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/features/tasks/api', () => ({ listTasks: vi.fn() }))

const NOW = new Date('2026-10-22T09:59:00')

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: '회의',
    memo: null,
    date: '2026-10-22',
    done: false,
    createdAt: '2026-10-22T00:00:00',
    category: null,
    priority: 'MEDIUM',
    startTime: '10:00',
    ...overrides,
  }
}

const NotificationMock = Object.assign(vi.fn(), { permission: 'default' as NotificationPermission })

function stubNotification(permission: NotificationPermission, requested: NotificationPermission = permission) {
  Object.assign(NotificationMock, {
    permission,
    requestPermission: vi.fn(async () => {
      NotificationMock.permission = requested
      return requested
    }),
  })
  vi.stubGlobal('Notification', NotificationMock)
}

function renderControl() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ReminderProvider>
        <ReminderControl />
      </ReminderProvider>
    </QueryClientProvider>,
  )
}

describe('알림 설정 UI와 발생', () => {
  beforeEach(() => {
    localStorage.clear()
    NotificationMock.mockClear()
    vi.mocked(listTasks).mockReset()
    vi.mocked(listTasks).mockResolvedValue([task()])
    // setTimeout은 실제 타이머로 두어 react-query/waitFor가 동작하게 한다.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'], now: NOW })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.mocked(toast.error).mockClear()
  })

  it('기본은 꺼짐이며 켜기 전에는 오늘 Task를 조회하지 않는다', () => {
    stubNotification('default')
    renderControl()

    expect(screen.getByRole('button', { name: '알림 켜기' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByLabelText('미리 알림 시간')).not.toBeInTheDocument()
    expect(listTasks).not.toHaveBeenCalled()
  })

  it('Notification API가 없으면 컨트롤을 그리지 않는다', () => {
    const { container } = renderControl()

    expect(container).toBeEmptyDOMElement()
  })

  it('권한을 허용하면 켜지고 설정이 저장된다', async () => {
    stubNotification('default', 'granted')
    renderControl()

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: '알림 켜기' }))

    expect(await screen.findByRole('button', { name: '알림 끄기' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(REMINDER_SETTINGS_KEY)!)).toEqual({ enabled: true, leadMinutes: 0 })
  })

  it('권한을 거부하면 켜지지 않고 안내 토스트를 보여준다', async () => {
    stubNotification('default', 'denied')
    renderControl()

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: '알림 켜기' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('권한')))
    expect(screen.getByRole('button', { name: '알림 켜기' })).toBeInTheDocument()
    expect(localStorage.getItem(REMINDER_SETTINGS_KEY)).toBeNull()
    expect(listTasks).not.toHaveBeenCalled()
  })

  it('미리 알림 시간을 바꾸면 저장되고 해당 시각부터 알린다', async () => {
    stubNotification('granted')
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify({ enabled: true, leadMinutes: 0 }))
    renderControl()

    const select = await screen.findByLabelText('미리 알림 시간')
    expect(select).toHaveValue('0')
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).selectOptions(select, '10')

    expect(JSON.parse(localStorage.getItem(REMINDER_SETTINGS_KEY)!).leadMinutes).toBe(10)
    // 09:59는 10분 전 구간 안이므로 바로 알린다.
    await waitFor(() => expect(NotificationMock).toHaveBeenCalledTimes(1))
    expect(NotificationMock).toHaveBeenCalledWith('회의', { body: '10:00 · 우선순위 보통', tag: '2026-10-22:1:10:00' })
  })

  it('정각 설정에서는 시각이 되면 한 번만 알리고 기록을 저장한다', async () => {
    stubNotification('granted')
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify({ enabled: true, leadMinutes: 0 }))
    renderControl()

    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(1))
    expect(NotificationMock).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    expect(NotificationMock).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    expect(NotificationMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    expect(NotificationMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(localStorage.getItem(REMINDER_NOTIFIED_KEY)!)).toEqual({
      date: '2026-10-22',
      keys: ['2026-10-22:1:10:00'],
    })
    // 추가 API 호출 없이 로컬 타이머로만 계산한다.
    expect(listTasks).toHaveBeenCalledTimes(1)
  })

  it('새로고침 후에도 오늘 이미 알린 Task는 다시 알리지 않는다', async () => {
    stubNotification('granted')
    vi.setSystemTime(new Date('2026-10-22T10:00:10'))
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify({ enabled: true, leadMinutes: 0 }))
    localStorage.setItem(
      REMINDER_NOTIFIED_KEY,
      JSON.stringify({ date: '2026-10-22', keys: ['2026-10-22:1:10:00'] }),
    )
    renderControl()

    await waitFor(() => expect(listTasks).toHaveBeenCalled())
    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    expect(NotificationMock).not.toHaveBeenCalled()
  })

  it('저장된 설정이 켜져 있어도 권한이 없으면 꺼진 상태로 보인다', () => {
    stubNotification('denied')
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify({ enabled: true, leadMinutes: 5 }))
    renderControl()

    expect(screen.getByRole('button', { name: '알림 켜기' })).toBeInTheDocument()
    expect(listTasks).not.toHaveBeenCalled()
  })
})
