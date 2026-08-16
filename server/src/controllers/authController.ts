import bcrypt from 'bcryptjs'
import type { Response } from 'express'
import { z } from 'zod'
import {
  authMiddleware,
  clearAuthCookie,
  setAuthCookie,
  signToken,
  type AuthRequest,
} from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { User } from '../models/User.js'

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function register(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>

  const existing = await User.findOne({ email })
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, passwordHash })

  const token = signToken({ userId: user._id.toString(), email: user.email })
  setAuthCookie(res, token)

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
    token,
  })
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const { email, password } = req.body as z.infer<typeof loginSchema>

  const user = await User.findOne({ email })
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = signToken({ userId: user._id.toString(), email: user.email })
  setAuthCookie(res, token)

  res.json({
    user: { id: user._id, name: user.name, email: user.email },
    token,
  })
}

export function logout(_req: AuthRequest, res: Response): void {
  clearAuthCookie(res)
  res.json({ ok: true })
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.userId).select('name email createdAt')
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json({
    user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
  })
}

export const registerValidators = [validateBody(registerSchema), register]
export const loginValidators = [validateBody(loginSchema), login]
export { authMiddleware }
