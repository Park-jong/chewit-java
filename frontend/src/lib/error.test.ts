import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import { getErrorMessage } from './error'

describe('getErrorMessage', () => {
  it('axios 에러이고 응답에 message가 있으면 그 메시지를 반환한다', () => {
    const error = new AxiosError('요청 실패')
    error.response = {
      data: { status: 404, message: '찾을 수 없습니다.', timestamp: '2026-01-01T00:00:00Z' },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      // @ts-expect-error - 테스트용 최소 config
      config: {},
    }

    expect(getErrorMessage(error)).toBe('찾을 수 없습니다.')
  })

  it('axios 에러지만 응답 바디에 message가 없으면 기본 메시지를 반환한다', () => {
    const error = new AxiosError('요청 실패')

    expect(getErrorMessage(error)).toBe('알 수 없는 오류가 발생했습니다.')
  })

  it('axios 에러가 아니면 기본 메시지를 반환한다', () => {
    expect(getErrorMessage(new Error('일반 에러'))).toBe('알 수 없는 오류가 발생했습니다.')
    expect(getErrorMessage('문자열 에러')).toBe('알 수 없는 오류가 발생했습니다.')
  })

  it('fallback을 직접 지정할 수 있다', () => {
    expect(getErrorMessage(new Error('일반 에러'), '커스텀 기본 메시지')).toBe('커스텀 기본 메시지')
  })
})
