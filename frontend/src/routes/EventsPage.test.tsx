import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EventsPage } from './EventsPage'
import { todayISO } from '@/lib/date'
import type { Event } from '@/features/events/types'

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const createMutate = vi.fn()
const deleteMutate = vi.fn()
const deleteOccurrenceMutate = vi.fn()
const updateOccurrenceMutate = vi.fn()
const mockUseEventsQuery = vi.fn()
const mockUseCategoriesQuery = vi.fn()

vi.mock('@/features/categories/hooks', () => ({
  useCategoriesQuery: (...args: unknown[]) => mockUseCategoriesQuery(...args),
}))

vi.mock('@/features/events/hooks', () => ({
  useEventsQuery: (...args: unknown[]) => mockUseEventsQuery(...args),
  useCreateEventMutation: () => ({ mutate: createMutate, isPending: false }),
  useDeleteEventMutation: () => ({ mutate: deleteMutate, isPending: false }),
  useDeleteEventOccurrenceMutation: () => ({ mutate: deleteOccurrenceMutate, isPending: false }),
  useUpdateEventOccurrenceMutation: () => ({ mutate: updateOccurrenceMutate, isPending: false }),
  useUpdateEventMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const sampleEvent: Event = {
  id: 1,
  title: '오늘 이벤트',
  memo: null,
  date: todayISO(),
  recurrence: 'NONE',
  occurrenceDate: todayISO(),
  createdAt: `${todayISO()}T00:00:00Z`,
  category: null,
  overridden: false,
  seriesTitle: '오늘 이벤트',
  seriesMemo: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 1, displayName: '테스터' }, logout: vi.fn() })
  mockUseEventsQuery.mockReturnValue({ data: [sampleEvent], isPending: false, isError: false })
  mockUseCategoriesQuery.mockReturnValue({ data: [], isPending: false, isError: false })
})

afterEach(() => {
  cleanup()
})

describe('EventsPage', () => {
  it('선택된 날짜(오늘)의 이벤트에 삭제 버튼을 누르면 삭제 mutate가 호출된다', () => {
    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventsPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteMutate).toHaveBeenCalledWith(1, expect.anything())
  })

  it('추가 폼을 제출하면 생성 mutate가 호출된다', () => {
    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventsPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('이벤트를 입력하세요'), {
      target: { value: '새 이벤트' },
    })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))

    expect(createMutate).toHaveBeenCalledWith(
      { title: '새 이벤트', date: todayISO(), recurrence: 'NONE', categoryId: null },
      expect.anything(),
    )
  })

  it('월간 그리드의 이벤트에 카테고리 색 점을 표시하고 없으면 표시하지 않는다', () => {
    const categorized: Event = {
      ...sampleEvent,
      id: 2,
      title: '카테고리 이벤트',
      category: { id: 5, name: '업무', color: '#3B82F6' },
    }
    mockUseEventsQuery.mockReturnValue({
      data: [sampleEvent, categorized],
      isPending: false,
      isError: false,
    })
    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventsPage />
      </MemoryRouter>,
    )

    const dots = screen.getAllByRole('img')
    expect(dots).toHaveLength(1)
    expect(dots[0]).toHaveAttribute('aria-label', '업무')
    expect(dots[0]).toHaveStyle({ backgroundColor: '#3B82F6' })
  })

  it('?month 쿼리 파라미터로 해당 월을 초기 표시하고, 잘못된 값이면 이번 달로 폴백한다', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/events?month=2025-03']}>
        <EventsPage />
      </MemoryRouter>,
    )
    expect(mockUseEventsQuery).toHaveBeenLastCalledWith('2025-03')
    expect(screen.getByText('2025년 3월')).toBeInTheDocument()
    unmount()

    render(
      <MemoryRouter initialEntries={['/events?month=2025-13']}>
        <EventsPage />
      </MemoryRouter>,
    )
    expect(mockUseEventsQuery).toHaveBeenLastCalledWith(todayISO().slice(0, 7))
  })
})
