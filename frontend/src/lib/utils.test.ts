import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('여러 클래스를 하나로 합친다', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('조건부 클래스 중 falsy 값을 제외한다', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })

  it('충돌하는 tailwind 클래스는 나중 값이 우선한다', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
