import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskItem } from './TaskItem'
import type { Task } from './types'

const categories = [
  { id: 1, name: '업무', color: '#3B82F6', createdAt: '2026-03-01T00:00:00Z' },
  { id: 2, name: '개인', color: '#22C55E', createdAt: '2026-03-01T00:00:00Z' },
]

const task: Task = {
  id: 5,
  title: '보고서',
  memo: '초안',
  date: '2026-03-09',
  done: true,
  createdAt: '2026-03-01T00:00:00Z',
  category: { id: 1, name: '업무', color: '#3B82F6' },
}

function renderItem(onUpdate = vi.fn(), overrides: Partial<Task> = {}) {
  render(
    <TaskItem
      task={{ ...task, ...overrides }}
      onToggle={vi.fn()}
      onDelete={vi.fn()}
      onMoveToTomorrow={vi.fn()}
      onUpdate={onUpdate}
      categories={categories}
    />,
  )
  return onUpdate
}

describe('TaskItem 수정', () => {
  it('수정 버튼을 누르면 현재 값이 채워진 폼이 보인다 (완료된 Task 포함)', () => {
    renderItem()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))

    expect((screen.getByLabelText('할일 제목') as HTMLInputElement).value).toBe('보고서')
    expect((screen.getByLabelText('할일 메모') as HTMLInputElement).value).toBe('초안')
    expect((screen.getByLabelText('할일 날짜') as HTMLInputElement).value).toBe('2026-03-09')
    expect((screen.getByLabelText('카테고리') as HTMLSelectElement).value).toBe('1')
  })

  it('저장하면 categoryId null을 포함한 payload로 onUpdate가 호출된다', () => {
    const onUpdate = renderItem()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('할일 제목'), { target: { value: ' 최종 보고서 ' } })
    fireEvent.change(screen.getByLabelText('할일 메모'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('할일 날짜'), { target: { value: '2026-03-10' } })
    fireEvent.change(screen.getByLabelText('카테고리'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onUpdate).toHaveBeenCalledWith(5, {
      title: '최종 보고서',
      memo: undefined,
      date: '2026-03-10',
      categoryId: null,
    })
  })

  it('취소하면 변경 없이 원래 표시로 돌아가고 다시 열면 원래 값이다', () => {
    const onUpdate = renderItem()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('할일 제목'), { target: { value: '바뀜' } })
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('보고서')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect((screen.getByLabelText('할일 제목') as HTMLInputElement).value).toBe('보고서')
  })

  it('제목이 공백이면 저장할 수 없다', () => {
    const onUpdate = renderItem()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('할일 제목'), { target: { value: '   ' } })
    const save = screen.getByRole('button', { name: '저장' }) as HTMLButtonElement
    fireEvent.click(save)

    expect(save.disabled).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
