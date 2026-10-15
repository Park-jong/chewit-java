import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { EventItem } from './EventItem'
import type { Event } from './types'

afterEach(() => {
  cleanup()
})

const weekly: Event = {
  id: 7,
  title: '회의',
  memo: null,
  date: '2026-03-02',
  recurrence: 'WEEKLY',
  occurrenceDate: '2026-03-09',
  createdAt: '2026-03-01T00:00:00Z',
  category: null,
  overridden: false,
}

describe('EventItem', () => {
  it('반복 이벤트의 삭제 버튼은 선택 UI를 보여주고 이 일정만 삭제를 호출한다', () => {
    const onDelete = vi.fn()
    const onDeleteOccurrence = vi.fn()
    render(<EventItem event={weekly} onDelete={onDelete} onDeleteOccurrence={onDeleteOccurrence} />)

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '이 일정만 삭제' }))

    expect(onDeleteOccurrence).toHaveBeenCalledWith(7, '2026-03-09')
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('반복 이벤트에서 모든 반복 삭제를 고르면 시리즈 삭제가 호출된다', () => {
    const onDelete = vi.fn()
    render(<EventItem event={weekly} onDelete={onDelete} onDeleteOccurrence={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    fireEvent.click(screen.getByRole('button', { name: '모든 반복 삭제' }))

    expect(onDelete).toHaveBeenCalledWith(7)
  })

  it('비반복 이벤트는 바로 삭제된다', () => {
    const onDelete = vi.fn()
    render(
      <EventItem
        event={{ ...weekly, recurrence: 'NONE' }}
        onDelete={onDelete}
        onDeleteOccurrence={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(onDelete).toHaveBeenCalledWith(7)
  })

  it('overridden 회차에는 수정됨 표식이 보인다', () => {
    render(<EventItem event={{ ...weekly, overridden: true }} onDelete={vi.fn()} />)

    expect(screen.getByText('수정됨')).toBeTruthy()
  })

  it('이 일정만 수정을 저장하면 회차 날짜와 함께 콜백이 호출된다', () => {
    const onUpdateOccurrence = vi.fn()
    render(<EventItem event={weekly} onDelete={vi.fn()} onUpdateOccurrence={onUpdateOccurrence} />)

    fireEvent.click(screen.getByRole('button', { name: '이 일정만 수정' }))
    fireEvent.change(screen.getByLabelText('이 일정 제목'), { target: { value: '특별회의' } })
    fireEvent.click(screen.getByRole('button', { name: '이 일정만 저장' }))

    expect(onUpdateOccurrence).toHaveBeenCalledWith(7, '2026-03-09', { title: '특별회의', memo: undefined })
  })
})
