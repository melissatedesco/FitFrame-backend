import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middlewares/authMiddleware.js';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { validate, rules } from '../middlewares/validate.js';

const router = express.Router();

// in sviluppo il limite è alto per non bloccare i test manuali
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 1000,
    message: { message: 'Troppi tentativi. Riprova tra 15 minuti.' },
    standardHeaders: true,
    legacyHeaders: false,
})

router.post('/register',
    authLimiter,
    validate([
        rules.required('name', 'Nome'),
        rules.required('surname', 'Cognome'),
        rules.email(),
        rules.minLength('password', 6, 'Password')
    ]),
    register
);

router.post('/login',
    authLimiter,
    validate([
        rules.email(),
        rules.required('password', 'Password')
    ]),
    login
);

// scambia un refresh token valido con un nuovo access token
router.post('/refresh', refresh);

// il logout non richiede protect: il refresh token nel body è sufficiente per identificare la sessione
router.post('/logout', logout);

export default router;
