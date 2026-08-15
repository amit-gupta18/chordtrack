import mongoose, { Schema, type Document, type Types } from 'mongoose'

export type StringIssue = 'silent' | 'buzzing' | 'wrongPitch' | 'muted'

export interface IPerStringDiagnosis {
  chord: string
  string: string
  issue: StringIssue
  likelyCause: string
}

export interface IProgressionTimestamp {
  chord: string
  atMs: number
}

export interface IChordFrequency {
  chord: string
  count: number
}

export interface IAudioAnalysis extends Document {
  _id: Types.ObjectId
  sessionId: Types.ObjectId
  expectedSequence: string[]
  detectedSequence: string[]
  switchCount: number
  chordPlays: number
  uniqueChords: string[]
  progressionTimestamps: IProgressionTimestamp[]
  chordFrequency: IChordFrequency[]
  accuracy: number
  actualBpm?: number
  targetBpm?: number
  timingDrift: number[]
  transitionDurationsMs: number[]
  hesitationPoints: number[]
  perStringDiagnosis: IPerStringDiagnosis[]
  strumming?: { expected: string[]; detected: string[] }
  aiFeedback?: string
  durationSeconds: number
  createdAt: Date
}

const audioAnalysisSchema = new Schema<IAudioAnalysis>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    expectedSequence: { type: [String], default: [] },
    detectedSequence: { type: [String], default: [] },
    switchCount: { type: Number, default: 0 },
    chordPlays: { type: Number, default: 0 },
    uniqueChords: { type: [String], default: [] },
    progressionTimestamps: [{ chord: String, atMs: Number }],
    chordFrequency: [{ chord: String, count: Number }],
    accuracy: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 60 },
    actualBpm: Number,
    targetBpm: Number,
    timingDrift: { type: [Number], default: [] },
    transitionDurationsMs: { type: [Number], default: [] },
    hesitationPoints: { type: [Number], default: [] },
    perStringDiagnosis: [
      {
        chord: String,
        string: String,
        issue: { type: String, enum: ['silent', 'buzzing', 'wrongPitch', 'muted'] },
        likelyCause: String,
      },
    ],
    strumming: {
      expected: [String],
      detected: [String],
    },
    aiFeedback: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const AudioAnalysis = mongoose.model<IAudioAnalysis>('AudioAnalysis', audioAnalysisSchema)
