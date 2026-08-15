import { Router } from 'express'
import {
  createJournalValidators,
  getStreak,
  listJournalEntries,
} from '../controllers/journalController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.post('/', ...createJournalValidators)
router.get('/', listJournalEntries)
router.get('/streak', getStreak)

export default router
