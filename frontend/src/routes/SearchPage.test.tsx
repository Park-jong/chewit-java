import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SearchPage } from './SearchPage'
import type { SearchResponse } from '@/features/search/types'

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, displayName: '테스터' }, logout: vi.fn() }),
}))

const mockUseSearchQuery = vi.fn()
const mockUseCategoriesQuery = vi.fn()

vi.mock('@/features/search/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/features/search/hooks')>('@/features/search/hooks')
  return {
    ...actual,
    useSearchQuery: (...args: unknown[]) => mockUseSearchQuery(...args),
  }
})

vi.mock('@/features/categories/hooks', () => ({
  useCategoriesQuery: () => mockUseCategoriesQuery(),
}))

const category = { id: 5, name: '업무', color: '#3B82F6' }

const sampleResult: SearchResponse = {
  tasks: [{ id: 1, title: '회의 준비', memo: null, date: '2026-03-05', done: false, category }],
  events: [
    { id: 2, title: '주간 회의', memo: null, date: '2026-02-10', recurrence: 'WEEKLY', category: null },
  ],
  checklists: [{ id: 3, title: '장보기', category: null, matchedItems: ['회의록 출력'] }],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/search']}>
      <SearchPage />
    </MemoryRouter>,
  )
}

function typeQuery(value: string) {
  fireEvent.change(screen.getByLabelText('검색어'), { target: { value } })
  act(() => {
    vi.advanceTimersByTime(300)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mockUseCategoriesQuery.mockReturnValue({ data: [], isPending: false, isError: false })
  mockUseSearchQuery.mockReturnValue({ data: undefined, isPending: true, isError: false })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('SearchPage', () => {
  it('검색어를 입력하기 전에는 안내 문구를 보여준다', () => {
    renderPage()

    expect(screen.getByText('검색어를 입력해 주세요.')).toBeInTheDocument()
    expect(mockUseSearchQuery).toHaveBeenLastCalledWith('', null)
  })

  it('입력은 300ms debounce 후 검색에 반영된다', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('검색어'), { target: { value: '회의' } })
    expect(mockUseSearchQuery).toHaveBeenLastCalledWith('', null)

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockUseSearchQuery).toHaveBeenLastCalledWith('회의', null)
  })

  it('결과를 종류별 섹션으로 보여주고 각 항목은 이동 링크가 된다', () => {
    mockUseSearchQuery.mockReturnValue({ data: sampleResult, isPending: false, isError: false })
    renderPage()
    typeQuery('회의')

    expect(screen.getByRole('region', { name: '할일 결과' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '이벤트 결과' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '체크리스트 결과' })).toBeInTheDocument()

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/?date=2026-03-05')
    expect(hrefs).toContain('/events?month=2026-02')
    expect(hrefs).toContain('/checklists?open=3')

    // 일치한 부분은 <mark>로 강조된다
    expect(document.querySelectorAll('mark').length).toBeGreaterThan(0)
    expect(screen.getByText('업무')).toBeInTheDocument()
  })

  it('결과가 없으면 빈 상태를 보여준다', () => {
    mockUseSearchQuery.mockReturnValue({
      data: { tasks: [], events: [], checklists: [] },
      isPending: false,
      isError: false,
    })
    renderPage()
    typeQuery('없는말')

    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })

  it('검색 실패 시 에러 문구를 보여준다', () => {
    mockUseSearchQuery.mockReturnValue({ data: undefined, isPending: false, isError: true })
    renderPage()
    typeQuery('회의')

    expect(screen.getByText('검색에 실패했습니다.')).toBeInTheDocument()
  })

  it('카테고리를 선택하면 categoryId가 검색에 전달되고, 카테고리가 없으면 필터를 숨긴다', () => {
    mockUseCategoriesQuery.mockReturnValue({ data: [{ ...category, createdAt: '' }], isPending: false })
    const { unmount } = renderPage()
    typeQuery('회의')

    fireEvent.change(screen.getByLabelText('카테고리'), { target: { value: '5' } })
    expect(mockUseSearchQuery).toHaveBeenLastCalledWith('회의', 5)
    unmount()

    mockUseCategoriesQuery.mockReturnValue({ data: [], isPending: false })
    renderPage()
    expect(screen.queryByLabelText('카테고리')).not.toBeInTheDocument()
  })
})
