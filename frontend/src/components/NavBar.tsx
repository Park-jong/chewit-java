import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ReminderControl } from '@/features/reminders/ReminderControl'
import { ThemeToggle } from '@/features/theme/ThemeToggle'

interface NavItem {
  to: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '오늘' },
  { to: '/events', label: '이벤트' },
  { to: '/checklists', label: '체크리스트' },
  { to: '/stats', label: '통계' },
  { to: '/calendar', label: '캘린더' },
  { to: '/categories', label: '카테고리' },
  { to: '/search', label: '검색' },
]

export function NavBar() {
  const { pathname } = useLocation()
  const tabListRef = useRef<HTMLDivElement>(null)

  // 좁은 폭에서 활성 탭이 스크롤 영역 밖에 있으면 탭 영역 안으로 가져온다. block: 'nearest'라 세로로는 움직이지 않는다.
  useEffect(() => {
    const activeTab = tabListRef.current?.querySelector('[aria-current="page"]')
    if (activeTab && typeof activeTab.scrollIntoView === 'function') {
      activeTab.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'auto' })
    }
  }, [pathname])

  return (
    <nav className="flex items-end gap-2 border-b border-border">
      {/* 탭 목록만 가로 스크롤한다. 활성 탭의 -mb-px가 잘리지 않도록 -mb-px pb-px로 테두리 줄까지 영역을 늘린다. */}
      <div ref={tabListRef} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto pb-px">
        {NAV_ITEMS.map((item) => {
          const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

          return isActive ? (
            <span
              key={item.to}
              aria-current="page"
              className="-mb-px shrink-0 rounded-t-md border border-b-background bg-background px-3 py-2 text-sm font-medium text-foreground"
            >
              {item.label}
            </span>
          ) : (
            <Link
              key={item.to}
              to={item.to}
              className="shrink-0 rounded-t-md border border-transparent bg-muted px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          )
        })}
      </div>
      <div className="flex shrink-0 items-center pb-1">
        <ReminderControl />
        <ThemeToggle />
      </div>
    </nav>
  )
}
