import db from '../config/db.js'

const Exercise = {

    // lista esercizi con filtri opzionali (RF-E1, RF-E2)
    // filtra per muscle_group, difficulty, equipment_id e/o attrezzi posseduti dall'utente
    getAll: async ({ muscle_group, difficulty, equipment_id, user_id } = {}) => {
        let query = `
            SELECT DISTINCT e.id, e.name, e.description, e.muscle_group,
                   e.difficulty, e.media_url, e.angle_rules
            FROM exercises e
        `
        const params = []

        // mostra solo esercizi dove l'utente possiede TUTTI gli attrezzi richiesti (RF-T3)
        // la subquery conta gli attrezzi richiesti che l'utente non ha: deve essere 0
        if (user_id) {
            query += `
                WHERE NOT EXISTS (
                    SELECT 1 FROM exercise_equipment ee2
                    WHERE ee2.exercise_id = e.id
                      AND ee2.equipment_id NOT IN (
                          SELECT equipment_id FROM user_equipment WHERE user_id = ?
                      )
                )
            `
            params.push(user_id)
        } else if (equipment_id) {
            query += `
                JOIN exercise_equipment ee ON e.id = ee.exercise_id
                    AND ee.equipment_id = ?
            `
            params.push(equipment_id)
        }

        if (!user_id) query += ' WHERE 1=1'
        else query += ' AND 1=1'

        if (muscle_group) {
            query += ' AND e.muscle_group = ?'
            params.push(muscle_group)
        }
        if (difficulty) {
            query += ' AND e.difficulty = ?'
            params.push(difficulty)
        }

        query += ' ORDER BY e.muscle_group, e.name'

        const [rows] = await db.execute(query, params)
        return rows
    },

    // verifica proprietà esercizio (trainer può modificare solo i propri)
    isOwner: async (exerciseId, userId) => {
        const [[row]] = await db.execute(
            'SELECT created_by FROM exercises WHERE id = ?', [exerciseId]
        )
        return row?.created_by === userId
    },

    // dettaglio esercizio con lista attrezzi richiesti (RF-E3, RF-E4)
    findById: async (id) => {
        const [[exercise]] = await db.execute(
            `SELECT id, name, description, muscle_group, difficulty, media_url, angle_rules, created_by
             FROM exercises WHERE id = ?`,
            [id]
        )
        if (!exercise) return null

        const [equipmentRows] = await db.execute(
            `SELECT eq.id, eq.name, eq.category
             FROM equipment eq
             JOIN exercise_equipment ee ON eq.id = ee.equipment_id
             WHERE ee.exercise_id = ?`,
            [id]
        )

        return { ...exercise, equipment: equipmentRows }
    },

    create: async ({ name, description, muscle_group, difficulty, media_url, angle_rules, created_by }) => {
        const [result] = await db.execute(
            `INSERT INTO exercises (name, description, muscle_group, difficulty, media_url, angle_rules, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description ?? null, muscle_group, difficulty, media_url ?? null,
             angle_rules ? JSON.stringify(angle_rules) : null, created_by ?? null]
        )
        return result.insertId
    },

    update: async (id, { name, description, muscle_group, difficulty, media_url, angle_rules }) => {
        const [result] = await db.execute(
            `UPDATE exercises SET name = ?, description = ?, muscle_group = ?,
             difficulty = ?, media_url = ?, angle_rules = ? WHERE id = ?`,
            [name, description ?? null, muscle_group, difficulty, media_url ?? null,
             angle_rules ? JSON.stringify(angle_rules) : null, id]
        )
        return result.affectedRows > 0
    },

    delete: async (id) => {
        const [result] = await db.execute('DELETE FROM exercises WHERE id = ?', [id])
        return result.affectedRows > 0
    },

    // collega/scollega un attrezzo a un esercizio
    addEquipment: async (exerciseId, equipmentId) => {
        await db.execute(
            'INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_id) VALUES (?, ?)',
            [exerciseId, equipmentId]
        )
    },

    removeEquipment: async (exerciseId, equipmentId) => {
        await db.execute(
            'DELETE FROM exercise_equipment WHERE exercise_id = ? AND equipment_id = ?',
            [exerciseId, equipmentId]
        )
    }
}

export default Exercise
