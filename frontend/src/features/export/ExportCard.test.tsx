import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { AxiosError, type AxiosResponse } from 'axios'
import { api } from '@/lib/api'
import { todayISO } from '@/lib/date'
import { ExportCard } from './ExportCard'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

let clickedDownloads: string[]

beforeEach(() => {
  vi.clearAllMocks()
  clickedDownloads = []
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clickedDownloads.push(`${this.download}|${this.href}`)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExportCard', () => {
  it('JSON 버튼은 format=json blob 요청 후 파일명으로 저장한다', async () => {
    const blob = new Blob(['{}'], { type: 'application/json' })
    mockedGet.mockResolvedValue({ data: blob })

    render(<ExportCard />)
    await userEvent.click(screen.getByRole('button', { name: 'JSON 내보내기' }))

    await waitFor(() => expect(clickedDownloads).toEqual([`chewit-export-${todayISO()}.json|blob:mock-url`]))
    expect(mockedGet).toHaveBeenCalledWith('/export', { params: { format: 'json' }, responseType: 'blob' })
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('CSV 버튼은 format=csv로 요청하고 .csv로 저장한다', async () => {
    mockedGet.mockResolvedValue({ data: new Blob(['a']) })

    render(<ExportCard />)
    await userEvent.click(screen.getByRole('button', { name: 'CSV 내보내기' }))

    await waitFor(() => expect(clickedDownloads).toEqual([`chewit-export-${todayISO()}.csv|blob:mock-url`]))
    expect(mockedGet).toHaveBeenCalledWith('/export', { params: { format: 'csv' }, responseType: 'blob' })
  })

  it('진행 중에는 두 버튼이 모두 비활성화되고 끝나면 다시 활성화된다', async () => {
    let resolve!: (value: { data: Blob }) => void
    mockedGet.mockReturnValue(new Promise((r) => (resolve = r)))

    render(<ExportCard />)
    await userEvent.click(screen.getByRole('button', { name: 'JSON 내보내기' }))

    expect(screen.getByRole('button', { name: 'JSON 내보내는 중...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'CSV 내보내기' })).toBeDisabled()

    resolve({ data: new Blob(['{}']) })
    await waitFor(() => expect(screen.getByRole('button', { name: 'CSV 내보내기' })).toBeEnabled())
    expect(screen.getByRole('button', { name: 'JSON 내보내기' })).toBeEnabled()
  })

  it('실패하면 toast.error를 띄우고 저장하지 않으며 버튼을 다시 활성화한다', async () => {
    mockedGet.mockRejectedValue(new Error('network'))

    render(<ExportCard />)
    await userEvent.click(screen.getByRole('button', { name: 'CSV 내보내기' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('내보내기에 실패했습니다.'))
    expect(clickedDownloads).toEqual([])
    expect(screen.getByRole('button', { name: 'CSV 내보내기' })).toBeEnabled()
  })

  function blobError(body: string, status = 400) {
    const response = { data: new Blob([body]), status, statusText: '', headers: {}, config: {} } as AxiosResponse
    return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response)
  }

  it('오류 응답이 Blob(JSON)이면 서버 message를 toast로 보여준다', async () => {
    mockedGet.mockRejectedValue(blobError(JSON.stringify({ message: 'format은 json 또는 csv여야 합니다.' })))

    render(<ExportCard />)
    await userEvent.click(screen.getByRole('button', { name: 'JSON 내보내기' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('format은 json 또는 csv여야 합니다.'))
    expect(clickedDownloads).toEqual([])
  })

  it('오류 Blob이 JSON이 아니면 고정 문구로 폴백한다', async () => {
    mockedGet.mockRejectedValue(blobError('<html>Bad Gateway</html>', 502))

    render(<ExportCard />)
    await userEvent.click(screen.getByRole('button', { name: 'JSON 내보내기' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('내보내기에 실패했습니다.'))
  })
})
