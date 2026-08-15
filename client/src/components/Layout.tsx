import { NavLink, Outlet } from 'react-router-dom'
import { useLogout } from '../queries/useAuth'
import { useAuthStore } from '../stores/useAuthStore'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/metronome', label: 'Metronome' },
  { to: '/journal', label: 'Journal' },
  { to: '/insights', label: 'Insights' },
]

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <div className="atlas-page">
      <nav className="border-b border-atlas-border bg-atlas-surface shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <NavLink to="/dashboard" className="text-lg font-bold text-atlas-blue">
            Chordtrack
          </NavLink>
          <div className="flex flex-wrap gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'atlas-nav-link-active' : 'atlas-nav-link')}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm text-atlas-muted">
            <span className="font-medium text-atlas-text">{user?.name}</span>
            <button type="button" onClick={() => logout.mutate()} className="atlas-btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
