import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ChecklistsPage } from './ChecklistsPage'
import type { Checklist } from '@/features/checklists/types'

import { toast } from 'sonner'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const createMutate = vi.fn()
const deleteMutate = vi.fn()
const duplicateMutate = vi.fn()
const toggleMutate = vi.fn()
const addItemMutate = vi.fn()
const renameMutate = vi.fn()
const mockUseChecklistsQuery = vi.fn()
const mockUseCategoriesQuery = vi.fn()

vi.mock('@/features/categories/hooks', () => ({
  useCategoriesQuery: (...args: unknown[]) => mockUseCategoriesQuery(...args),
}))

vi.mock('@/features/checklists/hooks', () => ({
  useChecklistsQuery: (...args: unknown[]) => mockUseChecklistsQuery(...args),
  useCreateChecklistMutation: () => ({ mutate: createMutate, isPending: false }),
  useDeleteChecklistMutation: () => ({ mutate: deleteMutate, isPending: false }),
  useDuplicateChecklistMutation: () => ({ mutate: duplicateMutate, isPending: false }),
  useRenameChecklistMutation: () => ({ mutate: renameMutate, isPending: false }),
  useAddChecklistItemMutation: () => ({ mutate: addItemMutate, isPending: false }),
  useToggleChecklistItemMutation: () => ({ mutate: toggleMutate, isPending: false }),
  useDeleteChecklistItemMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useReorderChecklistItemsMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const sampleChecklist: Checklist = {
  id: 1,
  title: '샘플 체크리스트',
  items: [{ id: 10, content: '항목 1', checked: false, sortOrder: 0 }],
  createdAt: '2026-01-01T00:00:00Z',
  category: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 1, displayName: '테스터' }, logout: vi.fn() })
  mockUseChecklistsQuery.mockReturnValue({ data: [sampleChecklist], isPending: false, isError: false })
  mockUseCategoriesQuery.mockReturnValue({ data: [], isPending: false, isError: false })
})

afterEach(() => {
  cleanup()
})

describe('ChecklistsPage', () => {
  it('?open=<id>로 진입하면 해당 체크리스트가 펼쳐진 상태로 시작한다', () => {
    render(
      <MemoryRouter initialEntries={['/checklists?open=1']}>
        <ChecklistsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('항목 1')).toBeInTheDocument()
  })

  it('체크리스트를 클릭하면 항목 목록이 인라인으로 펼쳐지고, 다시 클릭하면 접힌다', () => {
    render(
      <MemoryRouter initialEntries={['/checklists']}>
        <ChecklistsPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('항목 1')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /샘플 체크리스트/ }))
    expect(screen.getByText('항목 1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /샘플 체크리스트/ }))
    expect(screen.queryByText('항목 1')).not.toBeInTheDocument()
  })

  it('펼쳐진 항목의 체크박스를 클릭하면 토글 mutate가 호출된다', () => {
    render(
      <MemoryRouter initialEntries={['/checklists']}>
        <ChecklistsPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /샘플 체크리스트/ }))
    fireEvent.click(screen.getByRole('checkbox'))

    expect(toggleMutate).toHaveBeenCalledWith({ checklistId: 1, itemId: 10 }, expect.anything())
  })

  describe('복제', () => {
    function renderPage() {
      render(
        <MemoryRouter initialEntries={['/checklists']}>
          <ChecklistsPage />
        </MemoryRouter>,
      )
    }

    it('복제 버튼을 클릭하면 해당 체크리스트 id로 mutate가 호출된다', () => {
      renderPage()

      fireEvent.click(screen.getByRole('button', { name: '복제' }))

      expect(duplicateMutate).toHaveBeenCalledWith(1, expect.anything())
    })

    it('성공하면 성공 토스트를, 실패하면 오류 토스트를 표시한다', () => {
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: '복제' }))
      const options = duplicateMutate.mock.calls[0][1]

      options.onSuccess()
      expect(toast.success).toHaveBeenCalledWith('체크리스트를 복제했습니다.')

      options.onError(new Error('boom'))
      expect(toast.error).toHaveBeenCalledWith(expect.any(String))
    })
  })

  describe('이름 변경', () => {
    const categorized: Checklist = {
      ...sampleChecklist,
      category: { id: 5, name: '업무', color: '#ff0000' },
    }

    function renderExpanded(checklists: Checklist[] = [categorized]) {
      mockUseChecklistsQuery.mockReturnValue({ data: checklists, isPending: false, isError: false })
      render(
        <MemoryRouter initialEntries={['/checklists']}>
          <ChecklistsPage />
        </MemoryRouter>,
      )
      fireEvent.click(screen.getByRole('button', { name: new RegExp(checklists[0].title) }))
      return screen.getByDisplayValue(checklists[0].title) as HTMLInputElement
    }

    it('입력 후 이름 변경 버튼을 마우스로 클릭하면 blur가 일어나도 mutate가 호출된다', async () => {
      const user = userEvent.setup()
      const input = renderExpanded()

      await user.clear(input)
      await user.type(input, '새 제목')
      // user.click은 mousedown 시 입력창 blur 후 click을 발생시킨다.
      await user.click(screen.getByRole('button', { name: '이름 변경' }))

      expect(renameMutate).toHaveBeenCalledTimes(1)
      expect(renameMutate).toHaveBeenCalledWith(
        { id: 1, request: { title: '새 제목', categoryId: 5 } },
        expect.anything(),
      )
    })

    it('Enter로 제출해도 동일하게 mutate가 호출된다', async () => {
      const user = userEvent.setup()
      const input = renderExpanded()

      await user.clear(input)
      await user.type(input, '새 제목{Enter}')

      expect(renameMutate).toHaveBeenCalledWith(
        { id: 1, request: { title: '새 제목', categoryId: 5 } },
        expect.anything(),
      )
    })

    it('Esc를 누르면 입력값이 원래 제목으로 복귀하고 mutate는 호출되지 않는다', async () => {
      const user = userEvent.setup()
      const input = renderExpanded()

      await user.clear(input)
      await user.type(input, '임시')
      expect(input).toHaveValue('임시')

      await user.keyboard('{Escape}')

      expect(input).toHaveValue('샘플 체크리스트')
      expect(renameMutate).not.toHaveBeenCalled()
    })

    it('다른 체크리스트로 전환했다 돌아오면 이전 초안이 남지 않는다', async () => {
      const user = userEvent.setup()
      const other: Checklist = { ...sampleChecklist, id: 2, title: '다른 체크리스트' }
      const input = renderExpanded([sampleChecklist, other])

      await user.clear(input)
      await user.type(input, '초안')

      await user.click(screen.getByRole('button', { name: /다른 체크리스트/ }))
      await user.click(screen.getByRole('button', { name: /샘플 체크리스트/ }))

      expect(screen.getByDisplayValue('샘플 체크리스트')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('초안')).not.toBeInTheDocument()
    })

    it('동일 제목이나 빈 값을 제출하면 mutate가 호출되지 않는다', async () => {
      const user = userEvent.setup()
      const input = renderExpanded()

      await user.type(input, '{Enter}')
      await user.clear(input)
      await user.type(input, '   {Enter}')
      await user.clear(input)
      await user.type(input, '샘플 체크리스트{Enter}')

      expect(renameMutate).not.toHaveBeenCalled()
    })
  })
})
