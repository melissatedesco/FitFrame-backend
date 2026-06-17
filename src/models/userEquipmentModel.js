import db from '../config/db.js'

const UserEquipment = {

    // lista attrezzi posseduti dall'utente (RF-T2)
    getByUser: async (userId) => {
        const [rows] = await db.execute(
            `SELECT eq.id, eq.name, eq.category
             FROM equipment eq
             JOIN user_equipment ue ON eq.id = ue.equipment_id
             WHERE ue.user_id = ?
             ORDER BY eq.category, eq.name`,
            [userId]
        )
        return rows
    },

    // aggiunge un attrezzo alla lista dell'utente
    add: async (userId, equipmentId) => {
        await db.execute(
            'INSERT IGNORE INTO user_equipment (user_id, equipment_id) VALUES (?, ?)',
            [userId, equipmentId]
        )
    },

    // rimuove un attrezzo dalla lista dell'utente
    remove: async (userId, equipmentId) => {
        const [result] = await db.execute(
            'DELETE FROM user_equipment WHERE user_id = ? AND equipment_id = ?',
            [userId, equipmentId]
        )
        return result.affectedRows > 0
    },

    // sostituisce tutti gli attrezzi in una sola operazione
    replaceAll: async (userId, equipmentIds) => {
        const conn = await db.getConnection()
        try {
            await conn.beginTransaction()
            await conn.execute('DELETE FROM user_equipment WHERE user_id = ?', [userId])
            if (equipmentIds.length > 0) {
                const values = equipmentIds.map(eqId => [userId, eqId])
                await conn.query('INSERT INTO user_equipment (user_id, equipment_id) VALUES ?', [values])
            }
            await conn.commit()
        } catch (err) {
            await conn.rollback()
            throw err
        } finally {
            conn.release()
        }
    }
}

export default UserEquipment
