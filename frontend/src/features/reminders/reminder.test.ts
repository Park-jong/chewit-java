import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '@/features/tasks/types'
import {
  REMINDER_NOTIFIED_KEY,
  REMINDER_SETTINGS_KEY,
  findDueReminders,
  readNotifiedKeys,
  readReminderSettings,
  writeNotifiedKeys,
  writeReminderSettings,
} from './reminder'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: '회의',
    memo: null,
    date: '2026-10-22',
    done: false,
    createdAt: '2026-10-22T00:00:00',
    category: null,
    priority: null,
    startTime: '10:00',
    ...overrides,
  }
}

function at(time: string) {
  return new Date(`2026-10-22T${time}`)
}

describe('findDueReminders', () => {
  const none = new Set<string>()

  it('정각 설정: 시작 분에 도달하면 제목과 시간·우선순위로 알린다', () => {
    const due = findDueReminders([task({ priority: 'HIGH' })], {
      now: at('10:00:20'),
      leadMinutes: 0,
      notified: none,
    })

    expect(due).toEqual([{ key: '2026-10-22:1:10:00', title: '회의', body: '10:00 · 우선순위 높음' }])
  })

  it('우선순위가 없으면 본문에 시간만 표시하고 HH:mm:ss도 HH:mm으로 맞춘다', () => {
    const due = findDueReminders([task({ startTime: '10:00:00' })], {
      now: at('10:00:00'),
      leadMinutes: 0,
      notified: none,
    })

    expect(due[0].body).toBe('10:00')
  })

  it.each([
    [0, '09:59:59', false],
    [0, '10:00:00', true],
    [5, '09:54:59', false],
    [5, '09:55:00', true],
    [10, '09:49:59', false],
    [10, '09:50:00', true],
  ] as const)('미리 알림 %i분: %s에는 알림 여부 %s', (leadMinutes, time, expected) => {
    const due = findDueReminders([task()], { now: at(time), leadMinutes, notified: none })

    expect(due.length > 0).toBe(expected)
  })

  it('이미 지난 시각(앱을 늦게 연 경우)은 알리지 않는다', () => {
    expect(findDueReminders([task()], { now: at('10:01:00'), leadMinutes: 10, notified: none })).toEqual([])
  })

  it('완료, 시간 없음, 다른 날짜 Task는 제외한다', () => {
    const tasks = [
      task({ id: 1, done: true }),
      task({ id: 2, startTime: null }),
      task({ id: 3, date: '2026-10-23' }),
    ]

    expect(findDueReminders(tasks, { now: at('10:00:00'), leadMinutes: 0, notified: none })).toEqual([])
  })

  it('이미 알린 키는 제외하고, 시간이 바뀐 Task는 새 키라 다시 알린다', () => {
    const notified = new Set(['2026-10-22:1:10:00'])

    expect(findDueReminders([task()], { now: at('10:00:00'), leadMinutes: 0, notified })).toEqual([])
    expect(
      findDueReminders([task({ startTime: '10:05' })], { now: at('10:05:00'), leadMinutes: 0, notified }),
    ).toHaveLength(1)
  })
})

describe('알림 설정·기록 저장', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('저장값이 없거나 깨졌거나 범위 밖이면 기본값(꺼짐, 정각)이다', () => {
    expect(readReminderSettings()).toEqual({ enabled: false, leadMinutes: 0 })

    localStorage.setItem(REMINDER_SETTINGS_KEY, '{깨진 json')
    expect(readReminderSettings()).toEqual({ enabled: false, leadMinutes: 0 })

    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify({ enabled: 'yes', leadMinutes: 7 }))
    expect(readReminderSettings()).toEqual({ enabled: false, leadMinutes: 0 })
  })

  it('설정을 저장하고 복원한다', () => {
    writeReminderSettings({ enabled: true, leadMinutes: 10 })

    expect(readReminderSettings()).toEqual({ enabled: true, leadMinutes: 10 })
  })

  it('localStorage 접근이 실패하면 기본값으로 읽고 저장은 조용히 무시한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })

    expect(readReminderSettings()).toEqual({ enabled: false, leadMinutes: 0 })
    expect(readNotifiedKeys('2026-10-22').size).toBe(0)
    expect(() => writeReminderSettings({ enabled: true, leadMinutes: 5 })).not.toThrow()
    expect(() => writeNotifiedKeys('2026-10-22', new Set(['a']))).not.toThrow()
  })

  it('오늘 알린 키는 복원하고 지난 날짜 키는 버린다', () => {
    writeNotifiedKeys('2026-10-22', new Set(['k1', 'k2']))

    expect([...readNotifiedKeys('2026-10-22')]).toEqual(['k1', 'k2'])
    expect(readNotifiedKeys('2026-10-23').size).toBe(0)
  })

  it('알린 기록이 깨졌거나 형식이 틀리면 빈 집합이다', () => {
    localStorage.setItem(REMINDER_NOTIFIED_KEY, 'not json')
    expect(readNotifiedKeys('2026-10-22').size).toBe(0)

    localStorage.setItem(REMINDER_NOTIFIED_KEY, JSON.stringify({ date: '2026-10-22', keys: 'x' }))
    expect(readNotifiedKeys('2026-10-22').size).toBe(0)

    localStorage.setItem(REMINDER_NOTIFIED_KEY, JSON.stringify({ date: '2026-10-22', keys: ['ok', 1, null] }))
    expect([...readNotifiedKeys('2026-10-22')]).toEqual(['ok'])
  })
})
