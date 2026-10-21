import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { formatDisplayDate, todayISO } from '@/lib/date'

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, displayName: '테스터' }, logout: vi.fn() }),
}))

const { mockUseTasksQuery, mutation } = vi.hoisted(() => ({
  mockUseTasksQuery: vi.fn(),
  mutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/tasks/hooks', () => ({
  useTasksQuery: (...args: unknown[]) => mockUseTasksQuery(...args),
  useCreateTaskMutation: mutation,
  useToggleTaskMutation: mutation,
  useDeleteTaskMutation: mutation,
  useUpdateTaskMutation: mutation,
  useCarryOverTasksMutation: mutation,
}))

vi.mock('@/features/routines/hooks', () => ({
  useRoutinesQuery: () => ({ data: [], isPending: false, isError: false }),
  useCreateRoutineMutation: mutation,
  useToggleRoutineMutation: mutation,
  useDeleteRoutineMutation: mutation,
}))

vi.mock('@/features/events/hooks', () => ({
  useEventsQuery: () => ({ data: [], isPending: false, isError: false }),
}))

vi.mock('@/features/categories/hooks', () => ({
  useCategoriesQuery: () => ({ data: [], isPending: false, isError: false }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUseTasksQuery.mockReturnValue({ data: [], isPending: false, isError: false })
})

afterEach(() => {
  cleanup()
})

describe('DashboardPage', () => {
  it('?date 쿼리 파라미터로 해당 날짜를 초기 표시한다', () => {
    render(
      <MemoryRouter initialEntries={['/?date=2025-03-05']}>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(mockUseTasksQuery).toHaveBeenLastCalledWith('2025-03-05')
    expect(screen.getByText(formatDisplayDate('2025-03-05'))).toBeInTheDocument()
  })

  it('잘못된 ?date 값이면 오늘로 폴백한다', () => {
    render(
      <MemoryRouter initialEntries={['/?date=2025-02-30']}>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(mockUseTasksQuery).toHaveBeenLastCalledWith(todayISO())
  })
})
