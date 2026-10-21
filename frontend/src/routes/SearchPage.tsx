import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/features/auth/AuthContext'
import { useCategoriesQuery } from '@/features/categories/hooks'
import { CategoryBadge } from '@/features/categories/CategoryBadge'
import { CategorySelect } from '@/features/categories/CategorySelect'
import { RECURRENCE_LABELS } from '@/features/events/types'
import { Highlight } from '@/features/search/Highlight'
import { useDebouncedValue, useSearchQuery } from '@/features/search/hooks'
import { SEARCH_QUERY_MAX_LENGTH } from '@/features/search/types'
import { formatDisplayDate } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SEARCH_DEBOUNCE_MS = 300

const ITEM_LINK_CLASS = 'flex flex-col gap-1 rounded-md border p-3 transition-colors hover:bg-muted'

export function SearchPage() {
  const { user, logout } = useAuth()
  const [input, setInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)

  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const q = useDebouncedValue(input.trim(), SEARCH_DEBOUNCE_MS)
  // 삭제된 카테고리가 필터로 남아 있으면 전체로 취급한다.
  const activeFilter = categories.some((category) => category.id === categoryFilter) ? categoryFilter : null
  const searchQuery = useSearchQuery(q, activeFilter)
  const result = searchQuery.data

  const isEmpty =
    result !== undefined &&
    result.tasks.length === 0 &&
    result.events.length === 0 &&
    result.checklists.length === 0

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">chewit</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{user?.displayName}님</span>
          <Button variant="outline" onClick={logout}>
            로그아웃
          </Button>
        </div>
      </div>

      <NavBar />

      <h2 className="text-lg font-medium">검색</h2>

      <div className="flex gap-2">
        <input
          type="search"
          aria-label="검색어"
          placeholder="할일, 이벤트, 체크리스트 검색"
          value={input}
          maxLength={SEARCH_QUERY_MAX_LENGTH}
          onChange={(event) => setInput(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        />
        <CategorySelect
          categories={categories}
          value={activeFilter}
          onChange={setCategoryFilter}
          emptyLabel="전체 카테고리"
        />
      </div>

      {q.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">검색어를 입력해 주세요.</p>
      )}
      {q.length > 0 && searchQuery.isPending && (
        <p className="text-center text-sm text-muted-foreground">검색 중...</p>
      )}
      {searchQuery.isError && (
        <p className="text-center text-sm text-destructive">검색에 실패했습니다.</p>
      )}
      {isEmpty && <p className="text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>}

      {result && result.tasks.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="할일 결과">
          <h3 className="text-sm font-medium text-muted-foreground">할일 ({result.tasks.length})</h3>
          {result.tasks.map((task) => (
            <Link key={task.id} to={`/?date=${task.date}`} className={ITEM_LINK_CLASS}>
              <span className={cn('text-sm', task.done && 'text-muted-foreground line-through')}>
                <Highlight text={task.title} query={q} />
              </span>
              {task.memo && (
                <span className="truncate text-xs text-muted-foreground">
                  <Highlight text={task.memo} query={q} />
                </span>
              )}
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {formatDisplayDate(task.date)}
                <CategoryBadge category={task.category} />
              </span>
            </Link>
          ))}
        </section>
      )}

      {result && result.events.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="이벤트 결과">
          <h3 className="text-sm font-medium text-muted-foreground">이벤트 ({result.events.length})</h3>
          {result.events.map((event) => (
            <Link key={event.id} to={`/events?month=${event.date.slice(0, 7)}`} className={ITEM_LINK_CLASS}>
              <span className="text-sm">
                <Highlight text={event.title} query={q} />
              </span>
              {event.memo && (
                <span className="truncate text-xs text-muted-foreground">
                  <Highlight text={event.memo} query={q} />
                </span>
              )}
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {formatDisplayDate(event.date)} · {RECURRENCE_LABELS[event.recurrence]}
                <CategoryBadge category={event.category} />
              </span>
            </Link>
          ))}
        </section>
      )}

      {result && result.checklists.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="체크리스트 결과">
          <h3 className="text-sm font-medium text-muted-foreground">
            체크리스트 ({result.checklists.length})
          </h3>
          {result.checklists.map((checklist) => (
            <Link key={checklist.id} to={`/checklists?open=${checklist.id}`} className={ITEM_LINK_CLASS}>
              <span className="text-sm">
                <Highlight text={checklist.title} query={q} />
              </span>
              {checklist.matchedItems.map((content, index) => (
                <span key={index} className="truncate text-xs text-muted-foreground">
                  · <Highlight text={content} query={q} />
                </span>
              ))}
              <CategoryBadge category={checklist.category} />
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
