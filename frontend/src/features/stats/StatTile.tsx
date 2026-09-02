import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatTileProps {
  label: string
  value: string
  description: string
}

export function StatTile({ label, value, description }: StatTileProps) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-4">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </CardContent>
    </Card>
  )
}
