import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../../queries/useAuth'

export function LoginForm() {
  const navigate = useNavigate()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await login.mutateAsync({ email, password })
    navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6">
      <h1 className="text-2xl font-bold text-white">Sign in</h1>
      {login.isError && (
        <p className="text-sm text-red-400">{(login.error as Error).message}</p>
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
      />
      <button
        type="submit"
        disabled={login.isPending}
        className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-slate-400">
        No account? <Link to="/register" className="text-emerald-400 hover:underline">Register</Link>
      </p>
    </form>
  )
}
