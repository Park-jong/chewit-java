import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/features/auth/AuthContext'
import { useMonthlyStatsQuery } from '@/features/stats/hooks'
import { ExportCard } from '@/features/export/ExportCard'
import { StatTile } from '@/features/stats/StatTile'
import { DailyCompletionChart } from '@/features/stats/DailyCompletionChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addMonthsISO, formatDisplayMonth, todayYearMonth } from '@/lib/date'
import { Button } from '@/components/ui/button'

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

export function StatsPage() {
  const { user, logout } = useAuth()
  const [month, setMonth] = useState(todayYearMonth())

  const statsQuery = useMonthlyStatsQuery(month)
  const stats = statsQuery.data

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

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonthsISO(m, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium">{formatDisplayMonth(month)}</span>
          {month !== todayYearMonth() && (
            <button
              type="button"
              className="text-xs text-primary underline underline-offset-4"
              onClick={() => setMonth(todayYearMonth())}
            >
              이번 달로 이동
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonthsISO(m, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {statsQuery.isPending && (
        <p className="text-center text-sm text-muted-foreground">불러오는 중...</p>
      )}
      {statsQuery.isError && (
        <p className="text-center text-sm text-destructive">통계를 불러오지 못했습니다.</p>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="할일 완료율"
              value={formatPercent(stats.taskStats.completionRate)}
              description={`${stats.taskStats.completed} / ${stats.taskStats.total}건 완료`}
            />
            <StatTile
              label="루틴 완료율"
              value={formatPercent(stats.routineStats.completionRate)}
              description={`${stats.routineStats.completed} / ${stats.routineStats.expected}회 완료`}
            />
            <StatTile
              label="체크리스트 완료율"
              value={formatPercent(stats.checklistStats.completionRate)}
              description={`${stats.checklistStats.completedItems} / ${stats.checklistStats.totalItems}개 항목 (${stats.checklistStats.totalChecklists}개 목록)`}
            />
            <StatTile
              label="이벤트"
              value={`${stats.eventStats.occurrences}건`}
              description="이 달에 발생한 이벤트"
            />
          </div>

          {stats.routineStreaks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">루틴 연속 달성</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {stats.routineStreaks.map((streak) => (
                    <li key={streak.routineId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{streak.title}</span>
                      <span className="shrink-0 text-muted-foreground">
                        현재 {streak.currentStreak}일 · 최고 {streak.longestStreak}일
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">할일 완료 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyCompletionChart daily={stats.taskStats.daily} completedLabel="완료" totalLabel="전체" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">루틴 완료 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyCompletionChart daily={stats.routineStats.daily} completedLabel="완료" totalLabel="예정" />
            </CardContent>
          </Card>
        </>
      )}

      <ExportCard />
    </div>
  )
}
