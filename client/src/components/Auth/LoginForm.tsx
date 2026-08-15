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
    <form onSubmit={handleSubmit} className="atlas-card mx-auto w-full max-w-md space-y-4 p-6">
      <div className="mb-2">
        <h1 className="atlas-heading">Sign in</h1>
        <p className="atlas-subtext mt-1">Welcome back to Chordtrack</p>
      </div>
      {login.isError && <p className="atlas-error">{(login.error as Error).message}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="atlas-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="atlas-input"
      />
      <button type="submit" disabled={login.isPending} className="atlas-btn-primary w-full">
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-atlas-muted">
        No account? <Link to="/register" className="atlas-link">Register</Link>
      </p>
    </form>
  )
}
