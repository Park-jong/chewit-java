import { describe, expect, it } from 'vitest'
import { contrastRatio, needsOutline } from './color'

describe('contrastRatio', () => {
  it('흑/백은 21:1, 같은 색은 1:1이다', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5)
    expect(contrastRatio('#3b82f6', '#3b82f6')).toBeCloseTo(1, 5)
  })

  it('3자리 hex와 대문자를 6자리 소문자와 같게 취급한다', () => {
    expect(contrastRatio('#FFF', '#000')).toBeCloseTo(21, 5)
    expect(contrastRatio('#AbC', '#aabbcc')).toBeCloseTo(1, 5)
  })

  it('잘못된 값이면 null을 돌려준다', () => {
    expect(contrastRatio('red', '#ffffff')).toBeNull()
    expect(contrastRatio('#12345', '#ffffff')).toBeNull()
    expect(contrastRatio('', '')).toBeNull()
  })
})

describe('needsOutline', () => {
  it('아주 어두운 색은 다크에서만 테두리가 필요하다', () => {
    expect(needsOutline('#111111', true)).toBe(true)
    expect(needsOutline('#111111', false)).toBe(false)
  })

  it('아주 밝은 색은 라이트에서만 테두리가 필요하다', () => {
    expect(needsOutline('#ffff99', false)).toBe(true)
    expect(needsOutline('#ffff99', true)).toBe(false)
  })

  it('중간 밝기 색은 어느 테마에서도 필요 없다', () => {
    expect(needsOutline('#3B82F6', true)).toBe(false)
    expect(needsOutline('#3B82F6', false)).toBe(false)
  })

  it('3자리 hex와 대문자도 판정한다', () => {
    expect(needsOutline('#111', true)).toBe(true)
    expect(needsOutline('#FFFF99', false)).toBe(true)
  })

  it('잘못된 값은 테두리를 요구하지 않는다', () => {
    expect(needsOutline('not-a-color', true)).toBe(false)
    expect(needsOutline('', false)).toBe(false)
  })
})

describe('needsOutline (기준 배경 primary)', () => {
  it('라이트의 아주 어두운 색은 검은 칩 위에서 테두리가 필요하다', () => {
    expect(needsOutline('#111111', false, 'primary')).toBe(true)
    expect(needsOutline('#111111', false, 'page')).toBe(false)
  })

  it('다크의 아주 밝은 색은 연한 칩 위에서 테두리가 필요하다', () => {
    expect(needsOutline('#fafafa', true, 'primary')).toBe(true)
    expect(needsOutline('#fafafa', true, 'page')).toBe(false)
  })

  it('일반 색은 칩 위에서도 필요 없다', () => {
    expect(needsOutline('#3B82F6', false, 'primary')).toBe(false)
    expect(needsOutline('#B91C1C', true, 'primary')).toBe(false)
  })
})
