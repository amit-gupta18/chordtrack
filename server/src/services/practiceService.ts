import type { Types } from 'mongoose'
import type { IAudioAnalysis } from '../models/AudioAnalysis.js'
import { JournalEntry } from '../models/JournalEntry.js'
import { Session } from '../models/Session.js'

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
    if (uniqueDays[i - 1]! - uniqueDays[i]! === 86_400_000) streak++
    else break
  }
  return streak
}

export async function finalizePracticeSession(
  userId: string,
  sessionId: string,
  analysis: {
    detectedSequence: string[]
    durationSeconds: number
    actualBpm?: number | null
    targetBpm?: number
    accuracy: number
    aiFeedback?: string
  },
): Promise<void> {
  const uniqueChords = [...new Set(analysis.detectedSequence)]
  const transitions = Math.max(0, analysis.detectedSequence.length - 1)

  const chordPair =
    uniqueChords.length >= 2
      ? { from: uniqueChords[0]!, to: uniqueChords[1]! }
      : uniqueChords.length === 1
        ? { from: uniqueChords[0]!, to: uniqueChords[0]! }
        : undefined

  await Session.findByIdAndUpdate(sessionId, {
    durationSeconds: analysis.durationSeconds,
    transitionsCompleted: transitions,
    bpm: analysis.actualBpm ?? analysis.targetBpm,
    chordPair,
    type: uniqueChords.length >= 2 ? 'chordTransition' : 'freePractice',
  })

  const exerciseName =
    uniqueChords.length > 0
      ? `Chord practice: ${uniqueChords.join(', ')}`
      : 'Free practice'

  const durationMinutes = Math.max(1, Math.round(analysis.durationSeconds / 60))
  const notes =
    analysis.aiFeedback ??
    (uniqueChords.length > 0
      ? `Detected chords: ${uniqueChords.join(' → ')}. ${transitions} transitions in ${analysis.durationSeconds}s.`
      : `Practice session: ${analysis.durationSeconds}s.`)

  const today = startOfDay(new Date())
  const existing = await JournalEntry.findOne({ userId, date: { $gte: today, $lt: new Date(today.getTime() + 86_400_000) } })

  if (existing) {
    existing.exercises.push({ name: exerciseName, durationMinutes })
    existing.notes = existing.notes ? `${existing.notes}\n\n${notes}` : notes
    await existing.save()
    return
  }

  const allEntries = await JournalEntry.find({ userId }).select('date')
  const streakDay = computeStreak([...allEntries.map((e) => e.date), new Date()])

  await JournalEntry.create({
    userId,
    date: new Date(),
    exercises: [{ name: exerciseName, durationMinutes }],
    notes,
    streakDay,
  })
}

export async function createPracticeSession(userId: Types.ObjectId | string, targetBpm = 80) {
  return Session.create({
    userId,
    type: 'freePractice',
    bpm: targetBpm,
    durationSeconds: 0,
    transitionsCompleted: 0,
  })
}

export function buildSessionSummary(analysis: IAudioAnalysis, durationSeconds: number) {
  return {
    detectedSequence: analysis.detectedSequence,
    durationSeconds,
    actualBpm: analysis.actualBpm,
    targetBpm: analysis.targetBpm,
    accuracy: analysis.accuracy,
    aiFeedback: analysis.aiFeedback,
  }
}
