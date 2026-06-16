const db = require('../config/db')

const User = {
    // trova un utente tramite email (utile per la login per evitare i duplicati)
    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
        return rows[0]
    },

    // crea un nuovo utente nel database
    create: async (name, surname, email, hashedPassword) => {
        const [result] = await db.execute(
            'INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)',
            [name, surname, email, hashedPassword]
        );
        return result.insertId;
    },

    // trova l'utente per id
    findById: async (id) => {
        const [rows] = await db.execute('SELECT id, name, surname, email, role, created_at FROM users WHERE id = ?', [id])
        return rows[0]
    }
};

module.exports = User