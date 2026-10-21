import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoutineItem } from './RoutineItem'
import type { Routine } from './types'

const baseRoutine: Routine = {
  id: 1,
  title: '아주 아주 아주 아주 아주 아주 아주 아주 아주 긴 루틴 제목입니다 50자 넘김 테스트용',
  memo: null,
  daysOfWeek: ['MONDAY'],
  active: true,
  done: false,
  createdAt: '2026-01-01T00:00:00Z',
  completionRate: 0.5,
  currentStreak: 0,
  longestStreak: 0,
}

describe('RoutineItem', () => {
  it('긴 제목은 truncate 클래스가 적용되고 완료율 배지가 함께 렌더링된다', () => {
    render(<RoutineItem routine={baseRoutine} onToggle={vi.fn()} onDelete={vi.fn()} />)

    const title = screen.getByText(baseRoutine.title)
    expect(title.className).toContain('truncate')
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('currentStreak가 1 이하이면 연속 배지를 표시하지 않는다', () => {
    const { rerender } = render(
      <RoutineItem routine={{ ...baseRoutine, currentStreak: 1, longestStreak: 5 }} onToggle={vi.fn()} onDelete={vi.fn()} />,
    )
    expect(screen.queryByText(/일 연속/)).not.toBeInTheDocument()

    rerender(
      <RoutineItem routine={{ ...baseRoutine, currentStreak: 0 }} onToggle={vi.fn()} onDelete={vi.fn()} />,
    )
    expect(screen.queryByText(/일 연속/)).not.toBeInTheDocument()
  })

  it('currentStreak가 2 이상이면 "N일 연속" 배지와 aria-label을 표시한다', () => {
    render(
      <RoutineItem routine={{ ...baseRoutine, currentStreak: 2, longestStreak: 4 }} onToggle={vi.fn()} onDelete={vi.fn()} />,
    )

    const badge = screen.getByText('2일 연속')
    expect(badge).toBeInTheDocument()
    expect(screen.getByLabelText('2일 연속 달성')).toBe(badge)
  })
})
