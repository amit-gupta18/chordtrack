import type { Response } from 'express'
import { z } from 'zod'
import type { AuthRequest } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { Session } from '../models/Session.js'

const selfReportSchema = z.object({
  notesRangClearly: z.boolean().optional(),
  fingersRelaxed: z.boolean().optional(),
  usedAnchorFinger: z.boolean().optional(),
  rhythmSteady: z.boolean().optional(),
})

const createSessionSchema = z.object({
  type: z.enum(['chordTransition', 'strumming', 'song', 'freePractice']),
  chordPair: z.object({ from: z.string(), to: z.string() }).optional(),
  bpm: z.number().min(40).max(200).optional(),
  durationSeconds: z.number().min(1),
  transitionsCompleted: z.number().min(0),
  selfReport: selfReportSchema.optional(),
})

export async function createSession(req: AuthRequest, res: Response): Promise<void> {
  const data = req.body as z.infer<typeof createSessionSchema>
  const session = await Session.create({ ...data, userId: req.userId })
  res.status(201).json({ session })
}

export async function listSessions(req: AuthRequest, res: Response): Promise<void> {
  const filter: Record<string, unknown> = { userId: req.userId }

  if (req.query.from || req.query.to) {
    filter.createdAt = {}
    if (req.query.from) (filter.createdAt as Record<string, Date>).$gte = new Date(String(req.query.from))
    if (req.query.to) (filter.createdAt as Record<string, Date>).$lte = new Date(String(req.query.to))
  }

  if (req.query.chordPair) {
    const [from, to] = String(req.query.chordPair).split(':')
    if (from && to) filter['chordPair.from'] = from
    if (from && to) filter['chordPair.to'] = to
  }

  const sessions = await Session.find(filter).sort({ createdAt: -1 }).limit(100)
  res.json({ sessions })
}

export async function getSession(req: AuthRequest, res: Response): Promise<void> {
  const session = await Session.findOne({ _id: req.params.id, userId: req.userId })
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  res.json({ session })
}

export const createSessionValidators = [validateBody(createSessionSchema), createSession]
