import db from '../config/db.js'

const Program = {

    // lista schede: predefinite di sistema + quelle dell'utente (RF-S1, S2)
    getAll: async (userId) => {
        const [rows] = await db.execute(
            `SELECT id, name, description,
                    CASE WHEN user_id IS NULL THEN 'sistema' ELSE 'personale' END AS tipo
             FROM programs
             WHERE user_id IS NULL OR user_id = ?
             ORDER BY user_id IS NULL DESC, name`,
            [userId]
        )
        return rows
    },

    // dettaglio scheda con lista esercizi ordinati (RF-S3, S4)
    findById: async (id) => {
        const [[program]] = await db.execute(
            'SELECT id, name, description, user_id FROM programs WHERE id = ?',
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

    create: async (name, description, userId) => {
        const [result] = await db.execute(
            'INSERT INTO programs (name, description, user_id) VALUES (?, ?, ?)',
            [name, description ?? null, userId ?? null]
        )
        return result.insertId
    },

    update: async (id, name, description) => {
        const [result] = await db.execute(
            'UPDATE programs SET name = ?, description = ? WHERE id = ?',
            [name, description ?? null, id]
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
    }
}

export default Program
