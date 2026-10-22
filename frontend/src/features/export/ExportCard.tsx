import { useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { todayISO } from '@/lib/date'
import { getErrorMessage } from '@/lib/error'
import { exportFileName, fetchExport, saveBlob, type ExportFormat } from './api'

export function ExportCard() {
  const [pending, setPending] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setPending(format)
    try {
      const blob = await fetchExport(format)
      saveBlob(blob, exportFileName(format, todayISO()))
    } catch (error) {
      toast.error(getErrorMessage(error, '내보내기에 실패했습니다.'))
    } finally {
      setPending(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">데이터 내보내기</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          카테고리, 할일, 이벤트, 체크리스트, 루틴 전체를 내 기기로 저장합니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending !== null} onClick={() => handleExport('json')}>
            <Download className="size-4" />
            {pending === 'json' ? 'JSON 내보내는 중...' : 'JSON 내보내기'}
          </Button>
          <Button variant="outline" disabled={pending !== null} onClick={() => handleExport('csv')}>
            <Download className="size-4" />
            {pending === 'csv' ? 'CSV 내보내는 중...' : 'CSV 내보내기'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
