import db from '../config/db.js'
import crypto from 'crypto'

const PasswordReset = {
    create: async (userId) => {
        const token = crypto.randomBytes(48).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 ora
        await db.execute(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        )
        return token
    },

    findValid: async (token) => {
        const [[row]] = await db.execute(
            `SELECT pr.id, pr.user_id, u.email
             FROM password_resets pr
             JOIN users u ON pr.user_id = u.id
             WHERE pr.token = ? AND pr.used = 0 AND pr.expires_at > NOW()`,
            [token]
        )
        return row ?? null
    },

    markUsed: async (id) => {
        await db.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [id])
    },

    deleteOldTokens: async (userId) => {
        await db.execute('DELETE FROM password_resets WHERE user_id = ?', [userId])
    }
}

export default PasswordReset
