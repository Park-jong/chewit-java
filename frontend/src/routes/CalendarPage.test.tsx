import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CalendarPage } from './CalendarPage'
import { todayISO, todayYearMonth } from '@/lib/date'
import type { CalendarMonth } from '@/features/calendar/types'

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseCalendarQuery = vi.fn()
vi.mock('@/features/calendar/hooks', () => ({
  useCalendarQuery: (...args: unknown[]) => mockUseCalendarQuery(...args),
}))

const work = { id: 1, name: '업무', color: '#3B82F6' }

const sampleMonth: CalendarMonth = {
  month: todayYearMonth(),
  days: [
    {
      date: todayISO(),
      tasks: [
        { id: 1, title: '보고서', done: false, category: work },
        { id: 2, title: '장보기', done: false, category: null },
      ],
      routines: [],
      events: [{ id: 4, title: '회의', category: { id: 2, name: '개인', color: '#22C55E' } }],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 1, displayName: '테스터' }, logout: vi.fn() })
  mockUseCalendarQuery.mockReturnValue({ data: sampleMonth, isPending: false, isError: false })
})

afterEach(() => {
  cleanup()
})

describe('CalendarPage', () => {
  it('카테고리가 있는 할일·이벤트에만 이름이 붙은 색 점을 표시한다', () => {
    render(
      <MemoryRouter initialEntries={['/calendar']}>
        <CalendarPage />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(screen.getByRole('img', { name: '업무' })).toHaveStyle({ backgroundColor: '#3B82F6' })
    expect(screen.getByRole('img', { name: '개인' })).toHaveAttribute('title', '개인')
  })

  it('카테고리 없는 항목에는 정렬용 자리를 두되 접근성 트리에는 노출하지 않는다', () => {
    render(
      <MemoryRouter initialEntries={['/calendar']}>
        <CalendarPage />
      </MemoryRouter>,
    )

    const placeholders = screen.getAllByTestId('category-dot-placeholder')
    expect(placeholders).toHaveLength(1)
    expect(placeholders[0]).toHaveAttribute('aria-hidden', 'true')
  })
})
