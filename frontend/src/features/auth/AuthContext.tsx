import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { TOKEN_STORAGE_KEY } from '@/lib/api'
import { fetchCurrentUser, login as loginRequest, signup as signupRequest } from './api'
import type { LoginRequest, SignupRequest, UserResponse } from './types'

interface AuthContextValue {
  user: UserResponse | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  login: (request: LoginRequest) => Promise<void>
  signup: (request: SignupRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const CURRENT_USER_QUERY_KEY = ['auth', 'me']

function isAuthError(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  return status === 401 || status === 403
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)))

  const meQuery = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: hasToken,
    retry: false,
    // 오프라인이어도 쿼리가 일시정지(loading 고착)되지 않고 즉시 실패해 앱 셸이 뜨게 한다.
    // 온라인 복귀 시에는 refetchOnReconnect로 자동 재조회된다.
    networkMode: 'always',
  })

  // 토큰이 거부된 경우(401/403)만 로그아웃. 네트워크 오류·타임아웃·5xx는 토큰을 유지한다.
  const isTokenRejected = meQuery.isError && isAuthError(meQuery.error)

  function persistSession(token: string, user: UserResponse) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    setHasToken(true)
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user)
  }

  async function login(request: LoginRequest) {
    const { token, user } = await loginRequest(request)
    persistSession(token, user)
  }

  async function signup(request: SignupRequest) {
    const { token, user } = await signupRequest(request)
    persistSession(token, user)
  }

  useEffect(() => {
    if (hasToken && isTokenRejected) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setHasToken(false)
    }
  }, [hasToken, isTokenRejected])

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setHasToken(false)
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null)
    queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY })
  }

  const status: AuthContextValue['status'] = !hasToken
    ? 'unauthenticated'
    : meQuery.isPending
      ? 'loading'
      : isTokenRejected
        ? 'unauthenticated'
        : 'authenticated' // 일시적 오류면 user 없이(null) 인증 상태로 취급

  const value = useMemo<AuthContextValue>(
    () => ({
      user: status === 'authenticated' ? (meQuery.data ?? null) : null,
      status,
      login,
      signup,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, meQuery.data],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.')
  }
  return context
}
