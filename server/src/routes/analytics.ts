import { Router } from 'express'
import { getOverview } from '../controllers/analyticsController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.get('/overview', getOverview)

export default router
