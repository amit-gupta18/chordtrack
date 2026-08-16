import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface AuthPayload {
  userId: string
  email: string
}

export interface AuthRequest extends Request {
  userId?: string
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtSecret) as AuthPayload
}

function getTokenFromRequest(req: Request): string | undefined {
  const cookieToken = req.cookies?.token as string | undefined
  if (cookieToken) return cookieToken

  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return undefined
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = getTokenFromRequest(req)
  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const payload = verifyToken(token)
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: env.cookieMaxAgeMs,
    path: '/',
  })
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie('token', {
    path: '/',
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
  })
}
