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
})
