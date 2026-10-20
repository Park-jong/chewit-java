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
  seriesTitle: '회의',
  seriesMemo: null,
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

  it('시리즈 수정은 앵커 날짜로 채워지고 저장 시 categoryId null을 포함해 호출된다', () => {
    const onUpdateSeries = vi.fn()
    render(
      <EventItem
        event={{ ...weekly, category: { id: 1, name: '업무', color: '#3B82F6' } }}
        onDelete={vi.fn()}
        onUpdateOccurrence={vi.fn()}
        onUpdateSeries={onUpdateSeries}
        categories={[{ id: 1, name: '업무', color: '#3B82F6', createdAt: '2026-03-01T00:00:00Z' }]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '시리즈 수정' }))
    expect((screen.getByLabelText('시리즈 시작 날짜') as HTMLInputElement).value).toBe('2026-03-02')
    fireEvent.change(screen.getByLabelText('시리즈 제목'), { target: { value: ' 주간회의 ' } })
    fireEvent.change(screen.getByLabelText('카테고리'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '시리즈 저장' }))

    expect(onUpdateSeries).toHaveBeenCalledWith(7, {
      title: '주간회의',
      memo: undefined,
      date: '2026-03-02',
      recurrence: 'WEEKLY',
      categoryId: null,
    })
  })

  it('반복 규칙이나 날짜를 바꾸면 회차별 수정 초기화 안내가 보인다', () => {
    render(<EventItem event={weekly} onDelete={vi.fn()} onUpdateSeries={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '시리즈 수정' }))
    expect(screen.queryByText(/초기화됩니다/)).toBeNull()
    fireEvent.change(screen.getByLabelText('반복'), { target: { value: 'MONTHLY' } })

    expect(screen.getByText(/초기화됩니다/)).toBeTruthy()
  })

  it('시리즈 수정을 취소하면 호출 없이 원래 표시로 돌아가고, 회차 수정 버튼과 라벨이 구분된다', () => {
    const onUpdateSeries = vi.fn()
    render(
      <EventItem
        event={weekly}
        onDelete={vi.fn()}
        onUpdateOccurrence={vi.fn()}
        onUpdateSeries={onUpdateSeries}
      />,
    )

    expect(screen.getByRole('button', { name: '이 일정만 수정' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '시리즈 수정' }))
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(onUpdateSeries).not.toHaveBeenCalled()
    expect(screen.getByText('회의')).toBeTruthy()
  })

  describe('override된 회차', () => {
    const overriddenOccurrence: Event = {
      ...weekly,
      overridden: true,
      title: 'weekly-occ',
      memo: 'occ-memo',
      seriesTitle: 'weekly',
      seriesMemo: '원본 메모',
    }

    it('시리즈 수정은 override가 아닌 시리즈 원본 제목·메모로 채워진다', () => {
      render(<EventItem event={overriddenOccurrence} onDelete={vi.fn()} onUpdateSeries={vi.fn()} />)

      fireEvent.click(screen.getByRole('button', { name: '시리즈 수정' }))

      expect((screen.getByLabelText('시리즈 제목') as HTMLInputElement).value).toBe('weekly')
      expect((screen.getByLabelText('시리즈 메모') as HTMLInputElement).value).toBe('원본 메모')
    })

    it('날짜만 바꿔 저장해도 시리즈 제목은 원본으로 전송된다', () => {
      const onUpdateSeries = vi.fn()
      render(
        <EventItem event={overriddenOccurrence} onDelete={vi.fn()} onUpdateSeries={onUpdateSeries} />,
      )

      fireEvent.click(screen.getByRole('button', { name: '시리즈 수정' }))
      fireEvent.change(screen.getByLabelText('시리즈 시작 날짜'), { target: { value: '2026-03-03' } })
      fireEvent.click(screen.getByRole('button', { name: '시리즈 저장' }))

      expect(onUpdateSeries).toHaveBeenCalledWith(7, {
        title: 'weekly',
        memo: '원본 메모',
        date: '2026-03-03',
        recurrence: 'WEEKLY',
        categoryId: null,
      })
    })

    it('이 일정만 수정 폼은 회차 표시값으로 채워진다', () => {
      render(
        <EventItem
          event={overriddenOccurrence}
          onDelete={vi.fn()}
          onUpdateOccurrence={vi.fn()}
          onUpdateSeries={vi.fn()}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: '이 일정만 수정' }))

      expect((screen.getByLabelText('이 일정 제목') as HTMLInputElement).value).toBe('weekly-occ')
      expect((screen.getByLabelText('이 일정 메모') as HTMLInputElement).value).toBe('occ-memo')
    })
  })
})
