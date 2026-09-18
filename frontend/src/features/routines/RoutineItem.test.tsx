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
}

describe('RoutineItem', () => {
  it('긴 제목은 truncate 클래스가 적용되고 완료율 배지가 함께 렌더링된다', () => {
    render(<RoutineItem routine={baseRoutine} onToggle={vi.fn()} onDelete={vi.fn()} />)

    const title = screen.getByText(baseRoutine.title)
    expect(title.className).toContain('truncate')
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
