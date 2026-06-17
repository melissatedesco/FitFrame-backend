import express from 'express'
import protect from '../middlewares/authMiddleware.js'
import admin from '../middlewares/adminMiddleware.js'
import { getAllUsers, getUserProfile, updateUser, deleteUser } from '../controllers/userController.js'
import { validate, rules } from '../middlewares/validate.js'

const router = express.Router()

// GET /api/users — solo admin
router.get('/', protect, admin, getAllUsers)

// GET /api/users/profilo — utente loggato (il proprio profilo)
router.get('/profilo', protect, getUserProfile)

// GET /api/users/:id — admin o stesso utente
router.get('/:id', protect, getUserProfile)

// PUT /api/users/:id — admin o stesso utente
router.put('/:id',
    protect,
    validate([
        rules.required('name', 'Nome'),
        rules.required('surname', 'Cognome'),
        rules.email()
    ]),
    updateUser
)

// DELETE /api/users/:id — admin o stesso utente
router.delete('/:id', protect, deleteUser)

export default router
