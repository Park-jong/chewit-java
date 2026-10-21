import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StatsPage } from './StatsPage'
import type { MonthlyStats } from '@/features/stats/types'

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, displayName: '테스터' }, logout: vi.fn() }),
}))

vi.mock('@/features/stats/DailyCompletionChart', () => ({
  DailyCompletionChart: () => <div data-testid="chart" />,
}))

const mockUseMonthlyStatsQuery = vi.fn()

vi.mock('@/features/stats/hooks', () => ({
  useMonthlyStatsQuery: (...args: unknown[]) => mockUseMonthlyStatsQuery(...args),
}))

const baseStats: MonthlyStats = {
  month: '2026-03',
  taskStats: { total: 10, completed: 7, completionRate: 0.7, daily: [] },
  routineStats: { expected: 20, completed: 15, completionRate: 0.75, daily: [] },
  checklistStats: { totalChecklists: 3, totalItems: 12, completedItems: 8, completionRate: 8 / 12 },
  eventStats: { occurrences: 2 },
  routineStreaks: [],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/stats']}>
      <StatsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('StatsPage 루틴 연속 달성', () => {
  it('routineStreaks가 있으면 루틴 제목과 현재/최고 연속일을 표시한다', () => {
    mockUseMonthlyStatsQuery.mockReturnValue({
      data: {
        ...baseStats,
        routineStreaks: [
          { routineId: 1, title: '운동', currentStreak: 4, longestStreak: 9 },
          { routineId: 2, title: '독서', currentStreak: 2, longestStreak: 2 },
        ],
      },
      isPending: false,
      isError: false,
    })

    renderPage()

    expect(screen.getByText('루틴 연속 달성')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('운동')).toBeInTheDocument()
    expect(within(items[0]).getByText('현재 4일 · 최고 9일')).toBeInTheDocument()
    expect(within(items[1]).getByText('현재 2일 · 최고 2일')).toBeInTheDocument()
  })

  it('routineStreaks가 비어 있으면 섹션을 숨긴다', () => {
    mockUseMonthlyStatsQuery.mockReturnValue({ data: baseStats, isPending: false, isError: false })

    renderPage()

    expect(screen.getByText('할일 완료 추이')).toBeInTheDocument()
    expect(screen.queryByText('루틴 연속 달성')).not.toBeInTheDocument()
  })
})
