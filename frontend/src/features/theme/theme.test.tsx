import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

type Listener = (event: MediaQueryListEvent) => void

function stubMatchMedia(initialDark: boolean) {
  let matches = initialDark
  const listeners = new Set<Listener>()
  const query = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_: string, listener: Listener) => listeners.add(listener)),
    removeEventListener: vi.fn((_: string, listener: Listener) => listeners.delete(listener)),
  }
  window.matchMedia = (() => query) as unknown as typeof window.matchMedia
  return {
    query,
    listeners,
    setDark(next: boolean) {
      matches = next
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent))
    },
  }
}

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

describe('ThemeProvider / useTheme', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.matchMedia = originalMatchMedia
  })

  it('저장값이 없으면 시스템이 기본이고 시스템 설정을 따른다', () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('system')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('저장된 값을 복원한다', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('잘못된 저장값은 시스템으로 폴백한다', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple')
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('system')
    expect(result.current.resolvedTheme).toBe('light')
  })

  it('setTheme이 html 클래스, color-scheme, localStorage를 갱신한다', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => result.current.setTheme('dark'))
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    act(() => result.current.setTheme('light'))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('시스템 모드에서는 media query 변화를 실시간으로 반영한다', () => {
    const media = stubMatchMedia(false)
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.resolvedTheme).toBe('light')

    act(() => media.setDark(true))
    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('명시적으로 라이트를 고르면 시스템이 다크여도 라이트를 유지한다', () => {
    const media = stubMatchMedia(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => media.setDark(true))
    expect(result.current.resolvedTheme).toBe('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('언마운트 시 media query 리스너를 해제한다', () => {
    const media = stubMatchMedia(false)
    const { unmount } = renderHook(() => useTheme(), { wrapper })
    expect(media.listeners.size).toBe(1)

    unmount()
    expect(media.listeners.size).toBe(0)
  })

  it('localStorage가 throw해도 크래시하지 않고 시스템 설정으로 동작한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('system')

    act(() => result.current.setTheme('dark'))
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('Provider 밖에서도 안전하게 기본값을 돌려준다', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('system')
    expect(() => act(() => result.current.setTheme('dark'))).not.toThrow()
  })
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    stubMatchMedia(false)
  })

  it('시스템 -> 라이트 -> 다크 -> 시스템 순으로 순환하고 aria-label로 상태를 알린다', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button', { name: '테마: 시스템' })).toBeInTheDocument()

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: '테마: 라이트' })).toBeInTheDocument()

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: '테마: 다크' })).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: '테마: 시스템' })).toBeInTheDocument()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  it('좁은 폭에서는 텍스트를 숨기지만 접근성 이름과 title은 유지한다', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const button = screen.getByRole('button', { name: '테마: 시스템' })
    expect(button).toHaveAttribute('title', '클릭하면 라이트 테마로 바뀝니다')
    expect(screen.getByText('시스템')).toHaveClass('hidden', 'sm:inline')
  })
})
