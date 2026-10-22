import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'chewit_theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

// Provider 밖(예: 단독 렌더링되는 컴포넌트 테스트)에서도 안전하게 동작하도록 기본값을 둔다.
const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

function isTheme(value: unknown): value is Theme {
  return value === 'system' || value === 'light' || value === 'dark'
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // 저장에 실패해도 현재 세션에서는 선택한 테마가 적용된다.
  }
}

function getMediaQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY)
    : null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [systemDark, setSystemDark] = useState(() => getMediaQuery()?.matches ?? false)

  useEffect(() => {
    const query = getMediaQuery()
    if (!query) return
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    setSystemDark(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: ResolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    writeStoredTheme(next)
  }, [])

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}
