import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { THEME_STORAGE_KEY, ThemeProvider } from '@/features/theme/ThemeProvider'
import { CategoryDot } from './CategoryDot'

describe('CategoryDot', () => {
  it('카테고리 색 점을 렌더하고 이름을 aria-label과 title에 넣는다', () => {
    render(<CategoryDot category={{ id: 1, name: '업무', color: '#3B82F6' }} />)

    const dot = screen.getByRole('img', { name: '업무' })
    expect(dot).toHaveAttribute('title', '업무')
    expect(dot).toHaveStyle({ backgroundColor: '#3B82F6' })
  })

  it('다크에서 아주 어두운 색에는 진한 테두리를, 일반 색에는 얇은 링을 쓴다', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(
      <ThemeProvider>
        <CategoryDot category={{ id: 1, name: '어두움', color: '#111111' }} />
        <CategoryDot category={{ id: 2, name: '보통', color: '#3B82F6' }} />
      </ThemeProvider>,
    )

    expect(screen.getByRole('img', { name: '어두움' })).toHaveClass('ring-foreground/60')
    expect(screen.getByRole('img', { name: '보통' })).toHaveClass('ring-foreground/15')
    localStorage.clear()
  })

  it('라이트에서는 어두운 색에 진한 테두리를 쓰지 않고 아주 밝은 색에 쓴다', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    render(
      <ThemeProvider>
        <CategoryDot category={{ id: 1, name: '어두움', color: '#111111' }} />
        <CategoryDot category={{ id: 2, name: '밝음', color: '#ffff99' }} />
      </ThemeProvider>,
    )

    expect(screen.getByRole('img', { name: '어두움' })).toHaveClass('ring-foreground/15')
    expect(screen.getByRole('img', { name: '밝음' })).toHaveClass('ring-foreground/60')
    localStorage.clear()
  })

  it('against=primary면 칩 배경 기준으로 판정하고 primary-foreground 링을 쓴다', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    render(
      <ThemeProvider>
        <CategoryDot category={{ id: 1, name: '어두움', color: '#111111' }} against="primary" />
        <CategoryDot category={{ id: 2, name: '보통', color: '#3B82F6' }} against="primary" />
      </ThemeProvider>,
    )

    expect(screen.getByRole('img', { name: '어두움' })).toHaveClass('ring-primary-foreground/60')
    expect(screen.getByRole('img', { name: '보통' })).toHaveClass('ring-primary-foreground/15')
    localStorage.clear()
  })

  it('decorative면 접근성 트리에서 숨긴다', () => {
    const { container } = render(
      <CategoryDot category={{ id: 1, name: '업무', color: '#3B82F6' }} decorative />,
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('카테고리가 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<CategoryDot category={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('reserveSpace면 카테고리가 없어도 접근성 트리에 노출되지 않는 자리를 둔다', () => {
    render(<CategoryDot category={null} reserveSpace />)

    expect(screen.getByTestId('category-dot-placeholder')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
