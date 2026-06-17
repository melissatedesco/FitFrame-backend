import db from '../config/db.js';
import bcrypt from 'bcrypt';

const User = {

    // riservato all'admin: visualizza tutti gli utenti
    getAll: async () => {
        const [rows] = await db.execute('SELECT id, name, surname, email, role, created_at FROM users ORDER BY name')
        return rows
    },

    // visualizza utente per id
    findById: async (id) => {
        const [rows] = await db.execute('SELECT id, name, surname, email, role, created_at FROM users WHERE id = ?', [id])
        return rows[0]
    },

    // trova un utente tramite email (utile per login e per evitare duplicati)
    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
        return rows[0]
    },

    // crea un nuovo utente nel database
    create: async (name, surname, email, hashedPassword) => {
        const [result] = await db.execute(
            'INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)',
            [name, surname, email, hashedPassword]
        )
        return result.insertId
    },

    // modifica utente
    update: async (id, data) => {
        let query = 'UPDATE users SET name = ?, surname = ?, email = ?'
        let params = [data.name, data.surname, data.email]

        if (data.password) {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(data.password, salt)
            query += ', password = ?'
            params.push(hashedPassword)
        }

        if (data.role) {
            query += ', role = ?'
            params.push(data.role)
        }

        query += ' WHERE id = ?'
        params.push(id)

        const [result] = await db.execute(query, params)
        return result.affectedRows > 0
    },

    delete: async (id) => {
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id])
        return result.affectedRows > 0
    }
}

export default User
