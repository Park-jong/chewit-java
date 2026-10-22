import { isAxiosError } from 'axios'
import { api } from '@/lib/api'

export type ExportFormat = 'json' | 'csv'

/** GET /export. 인증 헤더가 필요해 fetch→Blob으로 받아야 하므로 axios(blob)로 요청한다. */
export async function fetchExport(format: ExportFormat): Promise<Blob> {
  try {
    const { data } = await api.get<Blob>('/export', { params: { format }, responseType: 'blob' })
    return data
  } catch (error) {
    throw await withParsedErrorBody(error)
  }
}

/**
 * responseType 'blob'이면 오류 응답 본문도 Blob이라 getErrorMessage가 message를 읽지 못한다.
 * Blob을 JSON으로 파싱해 response.data에 되돌려 놓고, 파싱 실패 시 원본 오류를 그대로 돌려준다.
 */
async function withParsedErrorBody(error: unknown): Promise<unknown> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text())
    } catch {
      // 본문이 JSON이 아니면 호출부의 고정 문구로 폴백한다.
    }
  }
  return error
}

export function exportFileName(format: ExportFormat, date: string): string {
  return `chewit-export-${date}.${format}`
}

/** Blob을 a[download]로 저장한다. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
