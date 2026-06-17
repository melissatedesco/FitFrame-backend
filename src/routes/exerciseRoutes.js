import express from 'express'
import protect from '../middlewares/authMiddleware.js'
import admin from '../middlewares/adminMiddleware.js'
import { validate, rules } from '../middlewares/validate.js'
import {
    getAllExercises, getExerciseById,
    createExercise, updateExercise, deleteExercise,
    addEquipmentToExercise, removeEquipmentFromExercise
} from '../controllers/exerciseController.js'

const router = express.Router()

const exerciseValidation = validate([
    rules.required('name', 'Nome'),
    rules.required('muscle_group', 'Gruppo muscolare'),
    rules.required('difficulty', 'Difficoltà')
])

// rotte accessibili a tutti gli utenti loggati
router.get('/', protect, getAllExercises)
router.get('/:id', protect, getExerciseById)

// rotte solo admin
router.post('/', protect, admin, exerciseValidation, createExercise)
router.put('/:id', protect, admin, exerciseValidation, updateExercise)
router.delete('/:id', protect, admin, deleteExercise)

// gestione attrezzi collegati a un esercizio
router.post('/:id/equipment/:equipmentId', protect, admin, addEquipmentToExercise)
router.delete('/:id/equipment/:equipmentId', protect, admin, removeEquipmentFromExercise)

export default router
