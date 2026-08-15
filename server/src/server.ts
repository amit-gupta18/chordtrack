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
import { createApp } from './app.js'

const app = createApp()
const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  cors: { origin: true, credentials: true },
})

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie ?? ''
  const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/)
  const token = tokenMatch?.[1]
  if (!token) {
    next(new Error('Authentication required'))
    return
  }
  try {
    const payload = verifyToken(decodeURIComponent(token))
    socket.data.userId = payload.userId
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

const activeStates = new Map<string, LiveAnalysisState>()

io.on('connection', (socket) => {
  socket.on('practice:start', async (data: { targetBpm?: number } = {}) => {
    const session = await createPracticeSession(socket.data.userId, data.targetBpm ?? 80)
    activeStates.set(socket.id, createAnalysisState(data.targetBpm ?? 80))
    socket.data.sessionId = session._id.toString()
    socket.emit('practice:started', { sessionId: session._id })
  })

  socket.on('practice:frame', (frame: AudioFrame) => {
    const state = activeStates.get(socket.id)
    if (!state) return
    const { state: next, feedback } = processFrame(state, frame)
    activeStates.set(socket.id, next)
    socket.emit('practice:feedback', feedback)
  })

  socket.on('practice:stop', async () => {
    const state = activeStates.get(socket.id)
    const sessionId = socket.data.sessionId as string | undefined
    if (!state || !sessionId) return

    const result = finalizeAnalysis(state, sessionId)
    const analysis = await saveAudioAnalysisWithFeedback(result, {
      bpm: result.targetBpm,
      transitionsCompleted: Math.max(0, result.detectedSequence.length - 1),
      chordPair:
        result.detectedSequence.length >= 2
          ? { from: result.detectedSequence[0]!, to: result.detectedSequence[1]! }
          : undefined,
    })

    await finalizePracticeSession(
      socket.data.userId,
      sessionId,
      buildSessionSummary(analysis, result.durationSeconds),
    )

    activeStates.delete(socket.id)
    socket.data.sessionId = undefined
    socket.emit('practice:complete', { analysis, sessionId })
  })

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
