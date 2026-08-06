import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <div className="flex min-h-svh items-center justify-center">불러오는 중...</div>
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
