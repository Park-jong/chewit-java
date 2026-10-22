// index.css의 --background 값을 sRGB hex로 옮긴 기준 배경색. 값이 바뀌면 함께 갱신한다.
// 라이트: oklch(1 0 0) = #ffffff, 다크: oklch(0.145 0 0) = #0a0a0a
export const LIGHT_BACKGROUND = '#ffffff'
export const DARK_BACKGROUND = '#0a0a0a'

// index.css의 --primary 값을 sRGB hex로 옮긴 색. 선택된 필터 칩처럼 bg-primary 위에 점이 놓일 때의 기준 배경이다.
// 라이트: oklch(0.205 0 0) = #171717, 다크: oklch(0.922 0 0) = #e5e5e5
export const LIGHT_PRIMARY = '#171717'
export const DARK_PRIMARY = '#e5e5e5'

// 점이 놓인 배경. page는 페이지 배경, primary는 bg-primary(선택된 칩 등).
export type DotBackground = 'page' | 'primary'

// WCAG가 비텍스트 UI 요소에 요구하는 최소 대비.
const MIN_UI_CONTRAST = 3

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const digits = match[1].length === 3 ? match[1].replace(/./g, (c) => c + c) : match[1]
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)) as [number, number, number]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

// WCAG 대비비(1~21). 둘 중 하나라도 올바른 hex가 아니면 null.
export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = parseHex(hexA)
  const b = parseHex(hexB)
  if (!a || !b) return null
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

// 카테고리 색이 놓인 배경과 3:1 미만으로 가까우면 true. 해석할 수 없는 색은 false(기본 링 유지).
export function needsOutline(hex: string, isDark: boolean, against: DotBackground = 'page'): boolean {
  const light = against === 'primary' ? LIGHT_PRIMARY : LIGHT_BACKGROUND
  const dark = against === 'primary' ? DARK_PRIMARY : DARK_BACKGROUND
  const ratio = contrastRatio(hex, isDark ? dark : light)
  return ratio !== null && ratio < MIN_UI_CONTRAST
}
