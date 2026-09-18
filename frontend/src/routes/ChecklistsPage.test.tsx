import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChecklistsPage } from './ChecklistsPage'
import type { Checklist } from '@/features/checklists/types'

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const createMutate = vi.fn()
const deleteMutate = vi.fn()
const toggleMutate = vi.fn()
const addItemMutate = vi.fn()
const mockUseChecklistsQuery = vi.fn()

vi.mock('@/features/checklists/hooks', () => ({
  useChecklistsQuery: (...args: unknown[]) => mockUseChecklistsQuery(...args),
  useCreateChecklistMutation: () => ({ mutate: createMutate, isPending: false }),
  useDeleteChecklistMutation: () => ({ mutate: deleteMutate, isPending: false }),
  useRenameChecklistMutation: () => ({ mutate: vi.fn(), isPending: false }),
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
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 1, displayName: '테스터' }, logout: vi.fn() })
  mockUseChecklistsQuery.mockReturnValue({ data: [sampleChecklist], isPending: false, isError: false })
})

afterEach(() => {
  cleanup()
})

describe('ChecklistsPage', () => {
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
})
