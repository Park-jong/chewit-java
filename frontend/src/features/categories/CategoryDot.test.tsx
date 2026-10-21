import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryDot } from './CategoryDot'

describe('CategoryDot', () => {
  it('카테고리 색 점을 렌더하고 이름을 aria-label과 title에 넣는다', () => {
    render(<CategoryDot category={{ id: 1, name: '업무', color: '#3B82F6' }} />)

    const dot = screen.getByRole('img', { name: '업무' })
    expect(dot).toHaveAttribute('title', '업무')
    expect(dot).toHaveStyle({ backgroundColor: '#3B82F6' })
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
