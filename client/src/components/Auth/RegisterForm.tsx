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
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6">
      <h1 className="text-2xl font-bold text-white">Create account</h1>
      {register.isError && (
        <p className="text-sm text-red-400">{(register.error as Error).message}</p>
      )}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
      />
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
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
      />
      <button
        type="submit"
        disabled={register.isPending}
        className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {register.isPending ? 'Creating…' : 'Register'}
      </button>
      <p className="text-center text-sm text-slate-400">
        Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
