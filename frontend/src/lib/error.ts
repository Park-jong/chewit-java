import { isAxiosError } from 'axios'
import type { ApiErrorBody } from '@/features/auth/types'

export function getErrorMessage(error: unknown, fallback = '알 수 없는 오류가 발생했습니다.') {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? fallback
  }
  return fallback
}
