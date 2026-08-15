import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import analyticsRoutes from './routes/analytics.js'
import authRoutes from './routes/auth.js'
import insightsRoutes from './routes/insights.js'
import journalRoutes from './routes/journal.js'
import sessionsRoutes from './routes/sessions.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  app.use(express.json())
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/sessions', sessionsRoutes)
  app.use('/api/journal', journalRoutes)
  app.use('/api/analytics', analyticsRoutes)
  app.use('/api/insights', insightsRoutes)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
