import { Router } from 'express'
import {
  createSessionValidators,
  getSession,
  listSessions,
} from '../controllers/sessionsController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.post('/', ...createSessionValidators)
router.get('/', listSessions)
router.get('/:id', getSession)

export default router
