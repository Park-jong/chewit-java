import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme, type Theme } from './ThemeProvider'

const NEXT_THEME: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
const LABEL: Record<Theme, string> = { system: '시스템', light: '라이트', dark: '다크' }
const ICON: Record<Theme, typeof Sun> = { system: Monitor, light: Sun, dark: Moon }

// 시스템 -> 라이트 -> 다크 순으로 순환하는 버튼. 현재 상태는 텍스트로도 표시한다.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = ICON[theme]

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="shrink-0 gap-1.5 text-xs text-muted-foreground"
      aria-label={`테마: ${LABEL[theme]}`}
      title={`클릭하면 ${LABEL[NEXT_THEME[theme]]} 테마로 바뀝니다`}
      onClick={() => setTheme(NEXT_THEME[theme])}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {/* 좁은 폭에서는 아이콘만 보인다. 이름은 aria-label/title로 유지된다. */}
      <span className="hidden sm:inline">{LABEL[theme]}</span>
    </Button>
  )
}
