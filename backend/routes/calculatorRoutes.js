import express from 'express'
import { getCalculatorAccess } from '../controllers/calculatorController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, getCalculatorAccess)

export default router
