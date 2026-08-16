import { Navigate, Outlet } from 'react-router-dom'
import { useMe } from '../../queries/useAuth'
import { useAuthStore } from '../../stores/useAuthStore'

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  const { isLoading, isError, isFetched } = useMe()

  if (user) return <Outlet />

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-atlas-bg text-atlas-muted">
        Loading…
      </div>
    )
  }

  if (isFetched && isError) return <Navigate to="/login" replace />

  return <Outlet />
}
