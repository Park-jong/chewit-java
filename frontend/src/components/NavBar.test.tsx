import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

describe('NavBar', () => {
  it('카테고리 탭은 /categories 링크로 렌더링되고, 해당 경로에서는 활성 span이 된다', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <NavBar />
      </MemoryRouter>,
    )

    const link = screen.getByText('카테고리')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/categories')
    unmount()

    render(
      <MemoryRouter initialEntries={['/categories']}>
        <NavBar />
      </MemoryRouter>,
    )

    const activeTab = screen.getByText('카테고리')
    expect(activeTab.tagName).toBe('SPAN')
    expect(activeTab).toHaveAttribute('aria-current', 'page')
  })

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

  it('검색 탭은 /search 링크로 렌더링된다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <NavBar />
      </MemoryRouter>,
    )

    expect(screen.getByText('검색')).toHaveAttribute('href', '/search')
  })

  it('활성 탭을 탭 영역 안으로 스크롤한다', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    try {
      render(
        <MemoryRouter initialEntries={['/search']}>
          <NavBar />
        </MemoryRouter>,
      )

      expect(scrollIntoView).toHaveBeenCalledTimes(1)
      expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByText('검색'))
      expect(scrollIntoView).toHaveBeenCalledWith({ inline: 'nearest', block: 'nearest', behavior: 'auto' })
    } finally {
      // jsdom 기본 상태(미구현)로 되돌린다.
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    }
  })

  it('scrollIntoView가 없는 환경에서도 에러 없이 렌더링된다', () => {
    expect(Element.prototype.scrollIntoView).toBeUndefined()
    expect(() =>
      render(
        <MemoryRouter initialEntries={['/search']}>
          <NavBar />
        </MemoryRouter>,
      ),
    ).not.toThrow()
  })
})
