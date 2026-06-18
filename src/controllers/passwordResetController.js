import db from '../config/db.js'
import bcrypt from 'bcrypt'
import PasswordReset from '../models/passwordResetModel.js'
import { sendPasswordResetEmail } from '../utils/mailer.js'

// POST /api/auth/forgot-password — invia email con link reset
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ message: 'Email obbligatoria.' })

        const [[user]] = await db.execute(
            'SELECT id FROM users WHERE email = ?', [email]
        )

        // risposta generica per non rivelare se l'email esiste
        if (!user) return res.json({ message: 'Se l\'email è registrata, riceverai un link per il reset.' })

        await PasswordReset.deleteOldTokens(user.id)
        const token = await PasswordReset.create(user.id)
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

        await sendPasswordResetEmail(email, resetUrl)

        res.json({ message: 'Se l\'email è registrata, riceverai un link per il reset.' })
    } catch (e) { next(e) }
}

// POST /api/auth/reset-password — imposta nuova password con token valido
export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body
        if (!token || !password) {
            return res.status(400).json({ message: 'Token e nuova password sono obbligatori.' })
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'La password deve essere di almeno 8 caratteri.' })
        }

        const record = await PasswordReset.findValid(token)
        if (!record) {
            return res.status(400).json({ message: 'Token non valido o scaduto.' })
        }

        const hash = await bcrypt.hash(password, 12)
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, record.user_id])
        await PasswordReset.markUsed(record.id)

        res.json({ message: 'Password aggiornata con successo. Puoi ora accedere.' })
    } catch (e) { next(e) }
}
