import { Navigate, Outlet } from 'react-router-dom'
import { useMe } from '../../queries/useAuth'

export function ProtectedRoute() {
  const { isLoading, isError } = useMe()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading…
      </div>
    )
  }

  if (isError) return <Navigate to="/login" replace />

  return <Outlet />
}
