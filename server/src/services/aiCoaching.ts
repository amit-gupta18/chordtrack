import OpenAI from 'openai'
import { env } from '../config/env.js'
import type { IPerStringDiagnosis } from '../models/AudioAnalysis.js'
import { AudioAnalysis } from '../models/AudioAnalysis.js'
import { JournalEntry } from '../models/JournalEntry.js'
import { Session } from '../models/Session.js'

interface ProgressionTimestamp {
  chord: string
  atMs: number
}

interface ChordFrequency {
  chord: string
  count: number
}

interface AnalysisCreateInput {
  sessionId: string
  expectedSequence: string[]
  detectedSequence: string[]
  switchCount: number
  chordPlays: number
  uniqueChords: string[]
  progressionTimestamps: ProgressionTimestamp[]
  chordFrequency: ChordFrequency[]
  accuracy: number
  actualBpm?: number | null
  targetBpm?: number
  timingDrift: number[]
  transitionDurationsMs: number[]
  hesitationPoints: number[]
  perStringDiagnosis: IPerStringDiagnosis[]
  durationSeconds: number
  strumming?: { expected: string[]; detected: string[] }
}

export interface TimedPracticeSummary {
  durationSeconds: number
  switchCount: number
  chordPlays: number
  uniqueChords: string[]
  detectedSequence: string[]
  progressionTimestamps: ProgressionTimestamp[]
  chordFrequency: ChordFrequency[]
  perStringDiagnosis: IPerStringDiagnosis[]
}

const openai = env.openaiApiKey
  ? new OpenAI({ apiKey: env.openaiApiKey })
  : null

function formatDurationText(seconds: number): string {
  if (seconds < 60) return `${seconds}-second`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  if (remainder === 0) return `${minutes}-minute`
  return `${minutes}m ${remainder}s`
}

function ruleBasedTimedFeedback(summary: TimedPracticeSummary): string {
  if (summary.chordPlays === 0) {
    return `No chords were detected in this ${formatDurationText(summary.durationSeconds)} session. Try playing each chord clearly and holding it for a beat before switching.`
  }

  const topChord = summary.chordFrequency[0]?.chord ?? 'your chords'
  const switchRate = summary.switchCount
  const durationText = formatDurationText(summary.durationSeconds)
  let message = `In your ${durationText} session you played ${summary.chordPlays} chord${summary.chordPlays === 1 ? '' : 's'} with ${switchRate} switch${switchRate === 1 ? '' : 'es'}. `

  if (summary.uniqueChords.length >= 3) {
    message += `Nice variety — you used ${summary.uniqueChords.join(', ')}. `
  } else if (summary.uniqueChords.length === 1) {
    message += `You stayed on ${topChord} — try adding a second chord to build transitions. `
  }

  if (summary.perStringDiagnosis.length > 0) {
    const d = summary.perStringDiagnosis[0]!
    message += `Watch the ${d.string} string on ${d.chord}: ${d.likelyCause}`
  } else {
    message += 'Keep holding each shape until it rings clearly before moving on.'
  }

  return message
}

export async function generateTimedPracticeFeedback(summary: TimedPracticeSummary): Promise<string> {
  if (!openai) return ruleBasedTimedFeedback(summary)

  const progressionLine = summary.progressionTimestamps
    .map((p) => `${p.chord}@${(p.atMs / 1000).toFixed(1)}s`)
    .join(' → ')

  const prompt = `Analyze this timed guitar chord practice session and give coaching in 3-4 short paragraphs:

Duration: ${summary.durationSeconds} seconds
Chords played (committed): ${summary.chordPlays}
Chord switches: ${summary.switchCount}
Unique chords: ${summary.uniqueChords.join(', ') || 'none'}
Full progression: ${progressionLine || 'none'}
Chord frequency: ${summary.chordFrequency.map((c) => `${c.chord}:${c.count}`).join(', ') || 'none'}
Per-string technique issues: ${JSON.stringify(summary.perStringDiagnosis)}

Cover:
1. Overall assessment of activity level (switches per minute, variety)
2. Chord clarity and which chords may need more work
3. Progression patterns (repetition, common pairs, hesitations inferred from timing gaps)
4. One concrete drill for the same duration next session

Be warm, specific, and actionable. No leaderboards or comparison to others.`

  const response = await openai.chat.completions.create({
    model: env.openaiModel,
    messages: [
      {
        role: 'system',
        content:
          'You are a warm, expert guitar teacher analyzing timed chord-switch practice. Reference the actual chords and timings from the data.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 450,
  })

  return response.choices[0]?.message?.content ?? ruleBasedTimedFeedback(summary)
}

export async function generateInsights(userId: string): Promise<string> {
  const [sessions, journal, analyses] = await Promise.all([
    Session.find({ userId }).sort({ createdAt: -1 }).limit(20),
    JournalEntry.find({ userId }).sort({ date: -1 }).limit(14),
    AudioAnalysis.find({
      sessionId: {
        $in: (await Session.find({ userId }).select('_id').limit(20)).map((s) => s._id),
      },
    }).limit(10),
  ])

  if (!openai) {
    const totalTransitions = sessions.reduce((sum, s) => sum + s.transitionsCompleted, 0)
    return `You've completed ${sessions.length} sessions with ${totalTransitions} total transitions. Keep practicing consistently — small daily sessions build muscle memory.`
  }

  const data = {
    recentSessions: sessions.map((s) => ({
      type: s.type,
      chordPair: s.chordPair,
      bpm: s.bpm,
      transitions: s.transitionsCompleted,
      selfReport: s.selfReport,
      date: s.createdAt,
    })),
    journalEntries: journal.map((j) => ({
      date: j.date,
      exercises: j.exercises,
      notes: j.notes,
    })),
    audioSummaries: analyses.map((a) => ({
      accuracy: a.accuracy,
      actualBpm: a.actualBpm,
      targetBpm: a.targetBpm,
      diagnosisCount: a.perStringDiagnosis.length,
    })),
  }

  const response = await openai.chat.completions.create({
    model: env.openaiInsightsModel,
    messages: [
      {
        role: 'system',
        content:
          'You are a supportive guitar teacher analyzing practice trends. Identify bottleneck chords, fatigue patterns, declining BPM trends, and technique habits worth fixing. No leaderboards or social comparison. Be warm and actionable.',
      },
      { role: 'user', content: JSON.stringify(data) },
    ],
    max_tokens: 500,
  })

  return (
    response.choices[0]?.message?.content ??
    'Keep practicing consistently. Your progress will show over time.'
  )
}

export async function saveAudioAnalysisWithFeedback(
  analysisData: AnalysisCreateInput,
): Promise<InstanceType<typeof AudioAnalysis>> {
  const aiFeedback = await generateTimedPracticeFeedback({
    durationSeconds: analysisData.durationSeconds,
    switchCount: analysisData.switchCount,
    chordPlays: analysisData.chordPlays,
    uniqueChords: analysisData.uniqueChords,
    detectedSequence: analysisData.detectedSequence,
    progressionTimestamps: analysisData.progressionTimestamps,
    chordFrequency: analysisData.chordFrequency,
    perStringDiagnosis: analysisData.perStringDiagnosis,
  })

  return AudioAnalysis.create({ ...analysisData, aiFeedback })
}
