import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../../queries/useAuth'

export function RegisterForm() {
  const navigate = useNavigate()
  const register = useRegister()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await register.mutateAsync({ name, email, password })
    navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="atlas-card mx-auto w-full max-w-md space-y-4 p-6">
      <div className="mb-2">
        <h1 className="atlas-heading">Create account</h1>
        <p className="atlas-subtext mt-1">Start tracking your guitar practice</p>
      </div>
      {register.isError && <p className="atlas-error">{(register.error as Error).message}</p>}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="atlas-input"
      />
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
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="atlas-input"
      />
      <button type="submit" disabled={register.isPending} className="atlas-btn-primary w-full">
        {register.isPending ? 'Creating…' : 'Register'}
      </button>
      <p className="text-center text-sm text-atlas-muted">
        Already have an account? <Link to="/login" className="atlas-link">Sign in</Link>
      </p>
    </form>
  )
}
