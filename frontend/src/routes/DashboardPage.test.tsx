import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { formatDisplayDate, todayISO } from '@/lib/date'

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, displayName: '테스터' }, logout: vi.fn() }),
}))

const { mockUseTasksQuery, mockUpdateMutate, mockCreateMutate, mockUseCategoriesQuery, mutation } = vi.hoisted(() => ({
  mockUseTasksQuery: vi.fn(),
  mockUpdateMutate: vi.fn(),
  mockCreateMutate: vi.fn(),
  mockUseCategoriesQuery: vi.fn(),
  mutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/tasks/hooks', () => ({
  useTasksQuery: (...args: unknown[]) => mockUseTasksQuery(...args),
  useCreateTaskMutation: () => ({ mutate: mockCreateMutate, isPending: false }),
  useToggleTaskMutation: mutation,
  useDeleteTaskMutation: mutation,
  useUpdateTaskMutation: () => ({ mutate: mockUpdateMutate, isPending: false }),
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
  useCategoriesQuery: () => mockUseCategoriesQuery(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUseTasksQuery.mockReturnValue({ data: [], isPending: false, isError: false })
  mockUseCategoriesQuery.mockReturnValue({ data: [], isPending: false, isError: false })
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

const baseTask = {
  memo: null,
  date: '2026-03-05',
  done: false,
  createdAt: '2026-03-05T00:00:00Z',
  category: null,
  priority: null,
  startTime: null,
}

function renderDashboard() {
  render(
    <MemoryRouter initialEntries={['/?date=2026-03-05']}>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage Task 우선순위·시간', () => {
  it('시간 오름차순으로 표시하고 시간 없는 항목은 서버 순서대로 뒤에 둔다', () => {
    mockUseTasksQuery.mockReturnValue({
      data: [
        { ...baseTask, id: 1, title: '시간없음A' },
        { ...baseTask, id: 2, title: '오후', startTime: '14:00' },
        { ...baseTask, id: 3, title: '시간없음B' },
        { ...baseTask, id: 4, title: '아침', startTime: '09:30:00' },
        { ...baseTask, id: 5, title: '아침동시간', startTime: '09:30' },
      ],
      isPending: false,
      isError: false,
    })

    renderDashboard()

    const titles = ['아침', '아침동시간', '오후', '시간없음A', '시간없음B']
    const positions = titles.map((title) => {
      const node = screen.getByText(title)
      return Array.from(document.body.querySelectorAll('p')).indexOf(node as HTMLParagraphElement)
    })
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('내일로 이월은 기존 priority와 startTime을 유지해 전송한다', () => {
    mockUseTasksQuery.mockReturnValue({
      data: [{ ...baseTask, id: 7, title: '보고서', priority: 'HIGH', startTime: '09:30' }],
      isPending: false,
      isError: false,
    })

    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: '내일로 이월' }))

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      {
        id: 7,
        request: {
          title: '보고서',
          memo: undefined,
          date: '2026-03-06',
          categoryId: null,
          priority: 'HIGH',
          startTime: '09:30',
        },
      },
      expect.anything(),
    )
  })

  it('추가 폼의 우선순위·시간이 생성 요청에 포함된다', () => {
    renderDashboard()

    fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요'), { target: { value: '회의' } })
    fireEvent.change(screen.getByLabelText('우선순위'), { target: { value: 'LOW' } })
    fireEvent.change(screen.getByLabelText('시간'), { target: { value: '10:15' } })
    fireEvent.click(screen.getAllByRole('button', { name: '추가' })[0])

    expect(mockCreateMutate).toHaveBeenCalledWith(
      { title: '회의', date: '2026-03-05', categoryId: null, priority: 'LOW', startTime: '10:15' },
      expect.anything(),
    )
  })
})

describe('DashboardPage 카테고리 필터 칩', () => {
  it('선택된 칩의 점은 칩 배경(primary) 기준 링을, 선택 안 된 칩은 페이지 기준 링을 쓴다', () => {
    mockUseCategoriesQuery.mockReturnValue({
      data: [
        { id: 1, name: '어두움', color: '#111111' },
        { id: 2, name: '파랑', color: '#3B82F6' },
      ],
      isPending: false,
      isError: false,
    })

    renderDashboard()
    const filter = screen.getByRole('group', { name: '카테고리 필터' })
    fireEvent.click(within(filter).getByRole('button', { name: '어두움' }))

    const selectedDot = within(filter).getByRole('button', { name: '어두움' }).firstElementChild
    const otherDot = within(filter).getByRole('button', { name: '파랑' }).firstElementChild
    expect(selectedDot).toHaveClass('ring-primary-foreground/60')
    expect(otherDot).toHaveClass('ring-foreground/15')
  })
})
