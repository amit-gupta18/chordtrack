import { Router } from 'express'
import {
  loginValidators,
  logout,
  me,
  registerValidators,
} from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/register', ...registerValidators)
router.post('/login', ...loginValidators)
router.post('/logout', authMiddleware, logout)
router.get('/me', authMiddleware, me)

export default router
