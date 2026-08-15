import { NavLink, Outlet } from 'react-router-dom'
import { useLogout } from '../queries/useAuth'
import { useAuthStore } from '../stores/useAuthStore'

const links = [
  { to: '/trainer', label: 'Trainer' },
  { to: '/metronome', label: 'Metronome' },
  { to: '/audio', label: 'Audio' },
  { to: '/journal', label: 'Journal' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/insights', label: 'Insights' },
]

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-bold text-emerald-400">Chordtrack</span>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-400">
            <span>{user?.name}</span>
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="rounded-lg border border-slate-600 px-3 py-1 hover:bg-slate-800"
            >
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
