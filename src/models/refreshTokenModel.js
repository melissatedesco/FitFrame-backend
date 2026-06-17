import db from '../config/db.js'

const RefreshToken = {

    // salva un nuovo refresh token nel DB
    save: async (userId, token, expiresAt) => {
        await db.execute(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        )
    },

    // cerca un refresh token — ritorna null se non esiste o è scaduto
    findValid: async (token) => {
        const [rows] = await db.execute(
            'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        )
        return rows[0] || null
    },

    // elimina un singolo refresh token (logout)
    delete: async (token) => {
        await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [token])
    },

    // elimina tutti i refresh token di un utente (es. cambio password)
    deleteAllForUser: async (userId) => {
        await db.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId])
    }
}

export default RefreshToken
