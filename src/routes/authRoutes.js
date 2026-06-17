import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { register, login, logout } from '../controllers/authController.js';
import { validate, rules } from '../middlewares/validate.js';

const router = express.Router();

router.post('/register',
    validate([
        rules.required('name', 'Nome'),
        rules.required('surname', 'Cognome'),
        rules.email(),
        rules.minLength('password', 6, 'Password')
    ]),
    register
);

router.post('/login',
    validate([
        rules.email(),
        rules.required('password', 'Password')
    ]),
    login
);

router.post('/logout', protect, logout);

export default router;
