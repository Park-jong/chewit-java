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
  priority: null,
  startTime: null,
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
      priority: null,
      startTime: null,
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

describe('TaskItem 우선순위·시간', () => {
  it('시간을 HH:mm으로 표시하고 우선순위는 텍스트 라벨 배지로 표시한다', () => {
    renderItem(vi.fn(), { priority: 'HIGH', startTime: '09:30:00' })

    expect(screen.getByText('09:30')).toBeInTheDocument()
    expect(screen.getByText('높음')).toBeInTheDocument()
  })

  it('우선순위와 시간이 없으면 시간·배지를 표시하지 않는다', () => {
    renderItem()

    expect(screen.queryByText('높음')).toBeNull()
    expect(screen.queryByText('보통')).toBeNull()
    expect(screen.queryByText('낮음')).toBeNull()
    expect(screen.queryByText(/^\d{2}:\d{2}$/)).toBeNull()
  })

  it('수정 폼의 우선순위 레이블은 추가 폼의 "우선순위"와 구분된다', () => {
    renderItem()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))

    expect(screen.getByLabelText('할일 우선순위')).toBeTruthy()
    expect(screen.queryByLabelText('우선순위', { exact: true })).toBeNull()
  })

  it('수정 폼에 기존 우선순위·시간이 채워지고 저장 시 그대로 전송한다', () => {
    const onUpdate = renderItem(vi.fn(), { priority: 'MEDIUM', startTime: '14:05:00' })

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect((screen.getByLabelText('할일 우선순위') as HTMLSelectElement).value).toBe('MEDIUM')
    expect((screen.getByLabelText('할일 시간') as HTMLInputElement).value).toBe('14:05')
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onUpdate).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ priority: 'MEDIUM', startTime: '14:05' }),
    )
  })

  it('우선순위와 시간을 비우고 저장하면 null로 전송해 해제한다', () => {
    const onUpdate = renderItem(vi.fn(), { priority: 'LOW', startTime: '07:00' })

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('할일 우선순위'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('할일 시간'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onUpdate).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ priority: null, startTime: null }),
    )
  })

  it('우선순위와 시간을 새로 지정해 저장할 수 있다', () => {
    const onUpdate = renderItem()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('할일 우선순위'), { target: { value: 'HIGH' } })
    fireEvent.change(screen.getByLabelText('할일 시간'), { target: { value: '18:45' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onUpdate).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ priority: 'HIGH', startTime: '18:45' }),
    )
  })
})
