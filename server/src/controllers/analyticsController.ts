import type { Response } from 'express'
import mongoose from 'mongoose'
import type { AuthRequest } from '../middleware/auth.js'
import { AudioAnalysis } from '../models/AudioAnalysis.js'
import { Session } from '../models/Session.js'

export async function getOverview(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId)

  const [sessions, chordPairs, bpmProgression] = await Promise.all([
    Session.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          transitions: { $sum: '$transitionsCompleted' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', transitions: 1, sessions: 1, _id: 0 } },
    ]),
    Session.aggregate([
      { $match: { userId: userId, chordPair: { $exists: true } } },
      {
        $group: {
          _id: { from: '$chordPair.from', to: '$chordPair.to' },
          count: { $sum: 1 },
          totalTransitions: { $sum: '$transitionsCompleted' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          chordPair: { from: '$_id.from', to: '$_id.to' },
          count: 1,
          totalTransitions: 1,
          _id: 0,
        },
      },
    ]),
    Session.aggregate([
      { $match: { userId: userId, bpm: { $exists: true } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgBpm: { $avg: '$bpm' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', avgBpm: { $round: ['$avgBpm', 1] }, _id: 0 } },
    ]),
  ])

  const sessionIds = await Session.find({ userId }).select('_id')
  const ids = sessionIds.map((s) => s._id)

  const avgAccuracy = ids.length
    ? await AudioAnalysis.aggregate([
        { $match: { sessionId: { $in: ids } } },
        { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } },
      ])
    : []

  res.json({
    transitionsOverTime: sessions,
    mostPracticedChords: chordPairs,
    bpmProgression,
    avgAccuracy: avgAccuracy[0]?.avgAccuracy ?? null,
  })
}
