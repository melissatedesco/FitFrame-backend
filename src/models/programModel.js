import db from '../config/db.js'

const Program = {

    // lista schede: predefinite di sistema + quelle dell'utente (RF-S1, S2)
    // se filterByEquipment=true, esclude schede che contengono esercizi
    // con attrezzi che l'utente non possiede (UC-3)
    getAll: async (userId, filterByEquipment = false) => {
        let query = `
            SELECT id, name, description, difficulty, duration_weeks, sessions_per_week,
                   CASE WHEN user_id IS NULL THEN 'sistema' ELSE 'personale' END AS tipo
            FROM programs
            WHERE user_id IS NULL OR user_id = ?
        `
        if (filterByEquipment) {
            // esclude schede che hanno almeno un esercizio con un attrezzo
            // non posseduto dall'utente
            query += `
              AND NOT EXISTS (
                SELECT 1 FROM program_exercises pe
                JOIN exercise_equipment ee ON pe.exercise_id = ee.exercise_id
                WHERE pe.program_id = programs.id
                  AND ee.equipment_id NOT IN (
                      SELECT equipment_id FROM user_equipment WHERE user_id = ?
                  )
              )
            `
        }
        query += ' ORDER BY user_id IS NULL DESC, name'

        const params = filterByEquipment ? [userId, userId] : [userId]
        const [rows] = await db.execute(query, params)
        return rows
    },

    // dettaglio scheda con lista esercizi ordinati (RF-S3, S4)
    findById: async (id) => {
        const [[program]] = await db.execute(
            'SELECT id, name, description, user_id, difficulty, duration_weeks, sessions_per_week FROM programs WHERE id = ?',
            [id]
        )
        if (!program) return null

        const [exercises] = await db.execute(
            `SELECT pe.id, pe.position, pe.sets, pe.reps, pe.rest_seconds,
                    e.id AS exercise_id, e.name, e.muscle_group, e.difficulty
             FROM program_exercises pe
             JOIN exercises e ON pe.exercise_id = e.id
             WHERE pe.program_id = ?
             ORDER BY pe.position`,
            [id]
        )

        return { ...program, exercises }
    },

    create: async (name, description, userId, { difficulty, duration_weeks, sessions_per_week } = {}) => {
        const [result] = await db.execute(
            `INSERT INTO programs (name, description, user_id, difficulty, duration_weeks, sessions_per_week)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description ?? null, userId ?? null,
             difficulty ?? null, duration_weeks ?? null, sessions_per_week ?? null]
        )
        return result.insertId
    },

    update: async (id, name, description, { difficulty, duration_weeks, sessions_per_week } = {}) => {
        const [result] = await db.execute(
            `UPDATE programs SET name = ?, description = ?,
             difficulty = ?, duration_weeks = ?, sessions_per_week = ?
             WHERE id = ?`,
            [name, description ?? null,
             difficulty ?? null, duration_weeks ?? null, sessions_per_week ?? null, id]
        )
        return result.affectedRows > 0
    },

    delete: async (id) => {
        const [result] = await db.execute('DELETE FROM programs WHERE id = ?', [id])
        return result.affectedRows > 0
    },

    isOwner: async (programId, userId) => {
        const [[row]] = await db.execute(
            'SELECT user_id FROM programs WHERE id = ?',
            [programId]
        )
        return row?.user_id === userId
    },

    // aggiunge un esercizio alla scheda (RF-S3)
    addExercise: async (programId, exerciseId, position, sets, reps, rest_seconds) => {
        const [result] = await db.execute(
            `INSERT INTO program_exercises (program_id, exercise_id, position, sets, reps, rest_seconds)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [programId, exerciseId, position, sets, reps, rest_seconds]
        )
        return result.insertId
    },

    // aggiorna un esercizio nella scheda (RF-S4)
    updateExercise: async (programExerciseId, { position, sets, reps, rest_seconds }) => {
        const [result] = await db.execute(
            `UPDATE program_exercises SET position = ?, sets = ?, reps = ?, rest_seconds = ?
             WHERE id = ?`,
            [position, sets, reps, rest_seconds, programExerciseId]
        )
        return result.affectedRows > 0
    },

    // rimuove un esercizio dalla scheda (RF-S3)
    removeExercise: async (programExerciseId) => {
        const [result] = await db.execute(
            'DELETE FROM program_exercises WHERE id = ?',
            [programExerciseId]
        )
        return result.affectedRows > 0
    },

    // riordina in blocco gli esercizi di una scheda (RF-S3)
    // items: [{id, position}, ...] — aggiorna solo le posizioni in una transazione
    reorderExercises: async (programId, items) => {
        const conn = await db.getConnection()
        try {
            await conn.beginTransaction()
            for (const { id, position } of items) {
                await conn.execute(
                    'UPDATE program_exercises SET position = ? WHERE id = ? AND program_id = ?',
                    [position, id, programId]
                )
            }
            await conn.commit()
        } catch (e) {
            await conn.rollback()
            throw e
        } finally {
            conn.release()
        }
    }
}

export default Program
