import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { generateInsights } from '../services/aiCoaching.js'

export async function getInsights(req: AuthRequest, res: Response): Promise<void> {
  const insights = await generateInsights(req.userId!)
  res.json({ insights })
}
