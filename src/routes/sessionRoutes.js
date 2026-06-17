import express from 'express'
import protect from '../middlewares/authMiddleware.js'
import {
    startSession, closeSession,
    getMySessions, getSessionById,
    logExercise, getMyStats
} from '../controllers/sessionController.js'

const router = express.Router()

// stats deve stare prima di /:id per non essere catturata come parametro
router.get('/stats', protect, getMyStats)

router.get('/', protect, getMySessions)
router.post('/', protect, startSession)
router.get('/:id', protect, getSessionById)
router.patch('/:id/close', protect, closeSession)
router.post('/:id/exercises', protect, logExercise)

export default router
