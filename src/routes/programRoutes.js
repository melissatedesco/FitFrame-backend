import express from 'express'
import protect from '../middlewares/authMiddleware.js'
import { validate, rules } from '../middlewares/validate.js'
import {
    getAllPrograms, getProgramById, createProgram, updateProgram, deleteProgram,
    addExercise, updateExercise, removeExercise, reorderExercises
} from '../controllers/programController.js'

const router = express.Router()

const programValidation = validate([rules.required('name', 'Nome')])

router.get('/', protect, getAllPrograms)
router.get('/:id', protect, getProgramById)
router.post('/', protect, programValidation, createProgram)
router.put('/:id', protect, programValidation, updateProgram)
router.delete('/:id', protect, deleteProgram)

// esercizi nella scheda
router.post('/:id/exercises', protect, addExercise)
router.put('/:id/exercises/reorder', protect, reorderExercises)
router.put('/:id/exercises/:peId', protect, updateExercise)
router.delete('/:id/exercises/:peId', protect, removeExercise)

export default router
