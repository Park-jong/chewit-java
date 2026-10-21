import { Link, useLocation } from 'react-router-dom'

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

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {NAV_ITEMS.map((item) => {
        const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

        return isActive ? (
          <span
            key={item.to}
            aria-current="page"
            className="-mb-px shrink-0 rounded-t-md border border-b-background bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            {item.label}
          </span>
        ) : (
          <Link
            key={item.to}
            to={item.to}
            className="shrink-0 rounded-t-md border border-transparent bg-muted px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
