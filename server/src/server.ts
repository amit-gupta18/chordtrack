import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { env } from './config/env.js'
import { connectDb } from './db/connect.js'
import { verifyToken } from './middleware/auth.js'
import { saveAudioAnalysisWithFeedback } from './services/aiCoaching.js'
import {
  createAnalysisState,
  finalizeAnalysis,
  processFrame,
  type AudioFrame,
  type LiveAnalysisState,
} from './services/audioAnalysis.js'
import {
  buildSessionSummary,
  createPracticeSession,
  finalizePracticeSession,
} from './services/practiceService.js'
import { clampSessionDuration, DEFAULT_SESSION_DURATION_SECONDS } from './lib/sessionDuration.js'
import { createApp } from './app.js'

const app = createApp()
const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  cors: { origin: '*' },
})

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined
  if (!token) {
    next(new Error('Authentication required'))
    return
  }
  try {
    const payload = verifyToken(token)
    socket.data.userId = payload.userId
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

const activeStates = new Map<string, LiveAnalysisState>()

io.on('connection', (socket) => {
  socket.on('practice:start', async (data: { targetBpm?: number; durationSeconds?: number } = {}) => {
    const durationSeconds = clampSessionDuration(data.durationSeconds ?? DEFAULT_SESSION_DURATION_SECONDS)
    const session = await createPracticeSession(socket.data.userId, data.targetBpm ?? 80)
    const state = createAnalysisState(data.targetBpm ?? 80)
    activeStates.set(socket.id, state)
    socket.data.sessionId = session._id.toString()
    socket.data.durationSeconds = durationSeconds
    socket.emit('practice:started', { sessionId: session._id, durationSeconds })
  })

  socket.on('practice:frame', (frame: AudioFrame) => {
    const state = activeStates.get(socket.id)
    if (!state) return
    const { state: next, feedback } = processFrame(state, frame)
    activeStates.set(socket.id, next)
    socket.emit('practice:feedback', feedback)
  })

  socket.on(
    'practice:stop',
    async (data?: {
      clientStats?: {
        progression: { chord: string; atMs: number }[]
        switchCount: number
        chordPlays: number
        sequence: string[]
      }
    }) => {
      const state = activeStates.get(socket.id)
      const sessionId = socket.data.sessionId as string | undefined
      if (!state || !sessionId) return

      const durationSeconds = (socket.data.durationSeconds as number | undefined) ?? 60
      const result = finalizeAnalysis(state, sessionId, data?.clientStats, durationSeconds)
      const analysis = await saveAudioAnalysisWithFeedback(result)

      await finalizePracticeSession(socket.data.userId, sessionId, buildSessionSummary(analysis))

      activeStates.delete(socket.id)
      socket.data.sessionId = undefined
      socket.data.durationSeconds = undefined
      socket.emit('practice:complete', {
        sessionId,
        analysis: {
          detectedSequence: analysis.detectedSequence,
          switchCount: analysis.switchCount,
          chordPlays: analysis.chordPlays,
          uniqueChords: analysis.uniqueChords,
          chordFrequency: analysis.chordFrequency,
          progressionTimestamps: analysis.progressionTimestamps,
          aiFeedback: analysis.aiFeedback,
          durationSeconds: analysis.durationSeconds,
        },
      })
    },
  )

  socket.on('disconnect', () => {
    activeStates.delete(socket.id)
  })
})

async function start() {
  await connectDb()
  httpServer.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
