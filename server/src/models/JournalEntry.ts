import mongoose, { Schema, type Document, type Types } from 'mongoose'

export interface IJournalEntry extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  date: Date
  exercises: { name: string; durationMinutes: number }[]
  notes: string
  streakDay?: number
  createdAt: Date
}

const journalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    exercises: [
      {
        name: { type: String, required: true },
        durationMinutes: { type: Number, required: true },
      },
    ],
    notes: { type: String, default: '' },
    streakDay: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

journalEntrySchema.index({ userId: 1, date: -1 })

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', journalEntrySchema)
