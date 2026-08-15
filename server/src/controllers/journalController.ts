import type { Response } from 'express'
import { z } from 'zod'
import type { AuthRequest } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { JournalEntry } from '../models/JournalEntry.js'

const createJournalSchema = z.object({
  date: z.coerce.date(),
  exercises: z.array(
    z.object({
      name: z.string().min(1),
      durationMinutes: z.number().min(0),
    }),
  ),
  notes: z.string().default(''),
})

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0

  const uniqueDays = [...new Set(dates.map((d) => startOfDay(d).getTime()))].sort((a, b) => b - a)
  const today = startOfDay(new Date()).getTime()
  const yesterday = today - 86_400_000

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i - 1] - uniqueDays[i] === 86_400_000) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export async function createJournalEntry(req: AuthRequest, res: Response): Promise<void> {
  const data = req.body as z.infer<typeof createJournalSchema>
  const date = new Date(data.date)

  const entries = await JournalEntry.find({ userId: req.userId }).select('date')
  const streakDay = computeStreak([...entries.map((e) => e.date), date])

  const entry = await JournalEntry.create({
    userId: req.userId,
    date,
    exercises: data.exercises,
    notes: data.notes,
    streakDay,
  })

  res.status(201).json({ entry })
}

export async function listJournalEntries(req: AuthRequest, res: Response): Promise<void> {
  const entries = await JournalEntry.find({ userId: req.userId }).sort({ date: -1 }).limit(100)
  res.json({ entries })
}

export async function getStreak(req: AuthRequest, res: Response): Promise<void> {
  const entries = await JournalEntry.find({ userId: req.userId }).select('date')
  const streak = computeStreak(entries.map((e) => e.date))
  res.json({ streak })
}

export const createJournalValidators = [validateBody(createJournalSchema), createJournalEntry]
