import mongoose, { Schema, type Document, type Types } from 'mongoose'

export type SessionType = 'chordTransition' | 'strumming' | 'song' | 'freePractice'

export interface ISelfReport {
  notesRangClearly?: boolean
  fingersRelaxed?: boolean
  usedAnchorFinger?: boolean
  rhythmSteady?: boolean
}

export interface ISession extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  type: SessionType
  chordPair?: { from: string; to: string }
  bpm?: number
  durationSeconds: number
  transitionsCompleted: number
  selfReport?: ISelfReport
  createdAt: Date
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['chordTransition', 'strumming', 'song', 'freePractice'],
      required: true,
    },
    chordPair: {
      from: String,
      to: String,
    },
    bpm: Number,
    durationSeconds: { type: Number, required: true },
    transitionsCompleted: { type: Number, required: true, default: 0 },
    selfReport: {
      notesRangClearly: Boolean,
      fingersRelaxed: Boolean,
      usedAnchorFinger: Boolean,
      rhythmSteady: Boolean,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

sessionSchema.index({ userId: 1, createdAt: -1 })
sessionSchema.index({ userId: 1, 'chordPair.from': 1, 'chordPair.to': 1 })

export const Session = mongoose.model<ISession>('Session', sessionSchema)
