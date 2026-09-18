import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

describe('NavBar', () => {
  it('현재 경로에 해당하는 탭은 비활성 span으로, 나머지는 링크로 렌더링된다', () => {
    render(
      <MemoryRouter initialEntries={['/events']}>
        <NavBar />
      </MemoryRouter>,
    )

    const activeTab = screen.getByText('이벤트')
    expect(activeTab.tagName).toBe('SPAN')
    expect(activeTab).toHaveAttribute('aria-current', 'page')

    const inactiveTab = screen.getByText('오늘')
    expect(inactiveTab.tagName).toBe('A')
  })
})
