import OpenAI from 'openai'
import { env } from '../config/env.js'
import type { IPerStringDiagnosis } from '../models/AudioAnalysis.js'
import { AudioAnalysis } from '../models/AudioAnalysis.js'
import { JournalEntry } from '../models/JournalEntry.js'
import { Session } from '../models/Session.js'

interface AnalysisCreateInput {
  sessionId: string
  expectedSequence: string[]
  detectedSequence: string[]
  accuracy: number
  actualBpm?: number | null
  targetBpm?: number
  timingDrift: number[]
  transitionDurationsMs: number[]
  hesitationPoints: number[]
  perStringDiagnosis: IPerStringDiagnosis[]
  strumming?: { expected: string[]; detected: string[] }
}

const openai = env.openaiApiKey
  ? new OpenAI({ apiKey: env.openaiApiKey })
  : null

function ruleBasedFeedback(diagnosis: IPerStringDiagnosis[]): string {
  if (diagnosis.length === 0) {
    return 'Nice work — your chord rang clearly. Keep practicing with steady rhythm.'
  }

  const first = diagnosis[0]!
  return `Your ${first.string} string on the ${first.chord} chord needs attention — ${first.likelyCause}`
}

export async function generateSessionFeedback(
  diagnosis: IPerStringDiagnosis[],
  sessionSummary: { chordPair?: { from: string; to: string }; bpm?: number; transitionsCompleted: number },
): Promise<string> {
  if (!openai) return ruleBasedFeedback(diagnosis)

  const prompt = `You are a supportive guitar teacher. No leaderboards, no pressure.
Give 2-3 sentences of encouraging coaching based on this practice data:
Chord pair: ${sessionSummary.chordPair?.from ?? '?'} ↔ ${sessionSummary.chordPair?.to ?? '?'}
Transitions: ${sessionSummary.transitionsCompleted}
BPM: ${sessionSummary.bpm ?? 'n/a'}
Per-string issues: ${JSON.stringify(diagnosis)}`

  const response = await openai.chat.completions.create({
    model: env.openaiModel,
    messages: [
      { role: 'system', content: 'You are a warm, supportive guitar teacher. Be concise and actionable.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 200,
  })

  return response.choices[0]?.message?.content ?? ruleBasedFeedback(diagnosis)
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
  sessionSummary: { chordPair?: { from: string; to: string }; bpm?: number; transitionsCompleted: number },
): Promise<InstanceType<typeof AudioAnalysis>> {
  const aiFeedback = await generateSessionFeedback(
    analysisData.perStringDiagnosis ?? [],
    sessionSummary,
  )

  return AudioAnalysis.create({ ...analysisData, aiFeedback })
}
