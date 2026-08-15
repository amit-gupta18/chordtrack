import { Router } from 'express'
import { getInsights } from '../controllers/insightsController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.get('/', getInsights)

export default router
