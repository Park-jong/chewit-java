import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  toISODate,
  todayISO,
  addDaysISO,
  formatDisplayDate,
  formatMonthDay,
  todayYearMonth,
  addMonthsISO,
  formatDisplayMonth,
  parseDateParam,
  parseMonthParam,
} from './date'

afterEach(() => {
  vi.useRealTimers()
})

describe('toISODate', () => {
  it('Date를 YYYY-MM-DD 형식으로 변환한다', () => {
    expect(toISODate(new Date(2026, 2, 5))).toBe('2026-03-05')
  })

  it('한 자리 월/일을 0으로 채운다', () => {
    expect(toISODate(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('todayISO/todayYearMonth', () => {
  it('시스템 시각 기준 오늘 날짜를 반환한다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 5))
    expect(todayISO()).toBe('2026-03-05')
    expect(todayYearMonth()).toBe('2026-03')
  })
})

describe('addDaysISO', () => {
  it('일수를 더한다', () => {
    expect(addDaysISO('2026-03-05', 3)).toBe('2026-03-08')
  })

  it('음수를 더하면 뺀다', () => {
    expect(addDaysISO('2026-03-05', -10)).toBe('2026-02-23')
  })

  it('월 경계를 넘어간다', () => {
    expect(addDaysISO('2026-03-31', 1)).toBe('2026-04-01')
  })

  it('윤년 2월을 처리한다', () => {
    expect(addDaysISO('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('평년 2월을 처리한다', () => {
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01')
  })
})

describe('addMonthsISO', () => {
  it('개월수를 더한다', () => {
    expect(addMonthsISO('2026-03', 2)).toBe('2026-05')
  })

  it('연도를 넘어가면 롤오버한다', () => {
    expect(addMonthsISO('2026-12', 1)).toBe('2027-01')
  })

  it('음수로 이전 연도로 되돌아간다', () => {
    expect(addMonthsISO('2026-01', -1)).toBe('2025-12')
  })
})

describe('formatDisplayDate/formatMonthDay', () => {
  it('요일을 포함한 전체 날짜를 표시한다', () => {
    // 2026-03-05는 목요일
    expect(formatDisplayDate('2026-03-05')).toBe('2026년 3월 5일 (목)')
  })

  it('월/일만 표시한다', () => {
    expect(formatMonthDay('2026-03-05')).toBe('3월 5일 (목)')
  })
})

describe('formatDisplayMonth', () => {
  it('년/월을 표시한다', () => {
    expect(formatDisplayMonth('2026-03')).toBe('2026년 3월')
  })
})

describe('parseDateParam / parseMonthParam', () => {
  it('유효한 날짜·월만 통과시키고 나머지는 null이다', () => {
    expect(parseDateParam('2026-03-05')).toBe('2026-03-05')
    expect(parseDateParam('2026-02-30')).toBeNull()
    expect(parseDateParam('2026-3-5')).toBeNull()
    expect(parseDateParam(null)).toBeNull()
    expect(parseMonthParam('2026-03')).toBe('2026-03')
    expect(parseMonthParam('2026-13')).toBeNull()
    expect(parseMonthParam('abc')).toBeNull()
  })
})
