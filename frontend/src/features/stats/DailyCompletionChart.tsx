import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import type { DailyCount } from './types'

interface DailyCompletionChartProps {
  daily: DailyCount[]
  completedLabel: string
  totalLabel: string
}

function dayOfMonth(iso: string): string {
  return String(Number(iso.slice(8, 10)))
}

function CustomTooltip({
  active,
  payload,
  completedLabel,
  totalLabel,
}: {
  active?: boolean
  payload?: { payload: DailyCount }[]
  completedLabel: string
  totalLabel: string
}) {
  if (!active || !payload?.length) return null
  const { date, completed, total } = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm">
      <p className="mb-1 font-medium">{dayOfMonth(date)}일</p>
      <p className="text-muted-foreground">
        {completedLabel} {completed} / {totalLabel} {total}
      </p>
    </div>
  )
}

export function DailyCompletionChart({ daily, completedLabel, totalLabel }: DailyCompletionChartProps) {
  const data = daily.map((d) => ({ ...d, remaining: Math.max(d.total - d.completed, 0) }))
  const tickInterval = Math.max(Math.ceil(data.length / 8) - 1, 0)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-primary" />
          {completedLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-muted" />
          {totalLabel}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tickFormatter={dayOfMonth}
            interval={tickInterval}
            tickLine={false}
            axisLine={false}
            fontSize={10}
            className="fill-muted-foreground"
          />
          <Tooltip
            content={<CustomTooltip completedLabel={completedLabel} totalLabel={totalLabel} />}
            cursor={{ fill: 'var(--color-accent)' }}
          />
          <Bar dataKey="completed" stackId="a" fill="var(--color-primary)" radius={[0, 0, 2, 2]} maxBarSize={14} />
          <Bar dataKey="remaining" stackId="a" fill="var(--color-muted)" radius={[2, 2, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
