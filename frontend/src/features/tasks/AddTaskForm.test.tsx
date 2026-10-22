import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddTaskForm } from './AddTaskForm'
import type { Category } from '@/features/categories/types'

const categories: Category[] = [{ id: 1, name: '업무', color: '#ff0000', createdAt: '2026-03-01T00:00:00' }]

function renderForm(withCategories = false) {
  const onAdd = vi.fn()
  render(<AddTaskForm onAdd={onAdd} categories={withCategories ? categories : []} />)
  return onAdd
}

describe('AddTaskForm', () => {
  it('우선순위와 시간을 선택하면 payload에 포함해 전송한다', () => {
    const onAdd = renderForm()

    fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요'), { target: { value: ' 회의 ' } })
    fireEvent.change(screen.getByLabelText('우선순위'), { target: { value: 'HIGH' } })
    fireEvent.change(screen.getByLabelText('시간'), { target: { value: '09:30' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))

    expect(onAdd).toHaveBeenCalledWith({
      title: '회의',
      categoryId: null,
      priority: 'HIGH',
      startTime: '09:30',
    })
  })

  it('우선순위와 시간을 선택하지 않으면 null로 전송한다', () => {
    const onAdd = renderForm()

    fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요'), { target: { value: '청소' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))

    expect(onAdd).toHaveBeenCalledWith({
      title: '청소',
      categoryId: null,
      priority: null,
      startTime: null,
    })
  })

  it('제출 후 제목·시간·우선순위는 비워지고 카테고리는 유지된다', () => {
    const onAdd = renderForm(true)

    fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요'), { target: { value: '회의' } })
    fireEvent.change(screen.getByLabelText('시간'), { target: { value: '09:30' } })
    fireEvent.change(screen.getByLabelText('우선순위'), { target: { value: 'HIGH' } })
    fireEvent.change(screen.getByLabelText('카테고리'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect((screen.getByPlaceholderText('할 일을 입력하세요') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('시간') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('우선순위') as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText('카테고리') as HTMLSelectElement).value).toBe('1')
  })
})
