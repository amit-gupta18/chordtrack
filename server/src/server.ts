import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { env } from './config/env.js'
import { connectDb } from './db/connect.js'
import { verifyToken } from './middleware/auth.js'
import { Session } from './models/Session.js'
import { saveAudioAnalysisWithFeedback } from './services/aiCoaching.js'
import {
  createAnalysisState,
  finalizeAnalysis,
  processFrame,
  type AudioFrame,
  type LiveAnalysisState,
} from './services/audioAnalysis.js'
import { createApp } from './app.js'

const app = createApp()
const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
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
  console.log(`Socket connected: ${socket.id}`)

  socket.on('audio:start', async (data: { sessionId: string; expectedSequence: string[]; targetBpm: number }) => {
    const session = await Session.findOne({ _id: data.sessionId, userId: socket.data.userId })
    if (!session) {
      socket.emit('audio:error', { error: 'Session not found' })
      return
    }

    activeStates.set(socket.id, createAnalysisState(data.expectedSequence, data.targetBpm))
    socket.emit('audio:started', { ok: true })
  })

  socket.on('audio:frame', (frame: AudioFrame) => {
    const state = activeStates.get(socket.id)
    if (!state) return

    const { state: next, feedback } = processFrame(state, frame)
    activeStates.set(socket.id, next)
    socket.emit('audio:feedback', feedback)
  })

  socket.on('audio:stop', async (data: { sessionId: string }) => {
    const state = activeStates.get(socket.id)
    if (!state) return

    const session = await Session.findOne({ _id: data.sessionId, userId: socket.data.userId })
    if (!session) {
      socket.emit('audio:error', { error: 'Session not found' })
      return
    }

    const result = finalizeAnalysis(state, data.sessionId)
    const analysis = await saveAudioAnalysisWithFeedback(result, {
      chordPair: session.chordPair,
      bpm: session.bpm,
      transitionsCompleted: session.transitionsCompleted,
    })

    activeStates.delete(socket.id)
    socket.emit('audio:complete', { analysis })
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
