import { Router } from 'express'
import express from 'express'
import protect from '../middlewares/authMiddleware.js'
import { getStatus, createCheckout, createPortal, handleWebhook } from '../controllers/subscriptionController.js'

const router = Router()

// Il webhook Stripe richiede il body RAW (non JSON parsato)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)

// Route protette — utente autenticato
router.get('/status',   protect, getStatus)
router.post('/checkout', protect, createCheckout)
router.post('/portal',   protect, createPortal)

export default router
