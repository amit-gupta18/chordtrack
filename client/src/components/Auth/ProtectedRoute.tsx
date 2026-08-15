import { Navigate, Outlet } from 'react-router-dom'
import { useMe } from '../../queries/useAuth'

export function ProtectedRoute() {
  const { isLoading, isError } = useMe()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-atlas-bg text-atlas-muted">
        Loading…
      </div>
    )
  }

  if (isError) return <Navigate to="/login" replace />

  return <Outlet />
}
