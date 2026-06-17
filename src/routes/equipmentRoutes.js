import express from 'express'
import protect from '../middlewares/authMiddleware.js'
import admin from '../middlewares/adminMiddleware.js'
import { getAllEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } from '../controllers/equipmentController.js'
import { validate, rules } from '../middlewares/validate.js'

const router = express.Router()

const equipmentValidation = validate([
    rules.required('name', 'Nome'),
    rules.required('category', 'Categoria')
])

// rotte accessibili agli utenti loggati
router.get('/', protect, getAllEquipment)
router.get('/:id', protect, getEquipmentById)

// rotte protette (solo admin)
router.post('/', protect, admin, equipmentValidation, createEquipment)
router.put('/:id', protect, admin, equipmentValidation, updateEquipment)
router.delete('/:id', protect, admin, deleteEquipment)

export default router
