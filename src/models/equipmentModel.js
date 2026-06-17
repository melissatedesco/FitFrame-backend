import db from '../config/db.js';

const Equipment = {

    // visualizza tutti gli attrezzi
    getAll: async () => {
        const [rows] = await db.execute('SELECT * FROM equipment ORDER BY category, name')
        return rows
    },

    // visualizza un singolo attrezzo
    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM equipment WHERE id = ?', [id])
        return rows[0]
    },

    // crea un nuovo attrezzo
    create: async (name, category) => {
        const [result] = await db.execute(
            'INSERT INTO equipment (name, category) VALUES (?, ?)',
            [name, category]
        )
        return result.insertId
    },

    // modifica attrezzo
    update: async (id, name, category) => {
        const [result] = await db.execute(
            'UPDATE equipment SET name = ?, category = ? WHERE id = ?',
            [name, category, id]
        )
        return result.affectedRows > 0
    },

    // elimina attrezzo (solo admin)
    delete: async (id) => {
        const [result] = await db.execute('DELETE FROM equipment WHERE id = ?', [id])
        return result.affectedRows > 0
    }
}

export default Equipment
