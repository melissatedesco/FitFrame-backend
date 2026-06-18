import db from '../config/db.js'

const Session = {

    // crea una nuova sessione (RF-P1)
    create: async (userId, programId, startedAt) => {
        const [result] = await db.execute(
            'INSERT INTO sessions (user_id, program_id, started_at) VALUES (?, ?, ?)',
            [userId, programId ?? null, startedAt]
        )
        return result.insertId
    },

    // chiude la sessione impostando l'orario di fine
    close: async (sessionId, endedAt) => {
        const [result] = await db.execute(
            'UPDATE sessions SET ended_at = ? WHERE id = ?',
            [endedAt, sessionId]
        )
        return result.affectedRows > 0
    },

    // storico sessioni dell'utente (RF-P2)
    getByUser: async (userId) => {
        const [rows] = await db.execute(
            `SELECT s.id, s.started_at, s.ended_at, s.notes,
                    p.name AS program_name
             FROM sessions s
             LEFT JOIN programs p ON s.program_id = p.id
             WHERE s.user_id = ?
             ORDER BY s.started_at DESC`,
            [userId]
        )
        return rows
    },

    // dettaglio singola sessione con esercizi eseguiti (RF-P3)
    findById: async (sessionId) => {
        const [[session]] = await db.execute(
            `SELECT s.id, s.user_id, s.started_at, s.ended_at, s.notes,
                    p.name AS program_name
             FROM sessions s
             LEFT JOIN programs p ON s.program_id = p.id
             WHERE s.id = ?`,
            [sessionId]
        )
        if (!session) return null

        const [exercises] = await db.execute(
            `SELECT se.id, se.sets_done, se.reps_done, se.form_score,
                    e.id AS exercise_id, e.name, e.muscle_group
             FROM session_exercises se
             JOIN exercises e ON se.exercise_id = e.id
             WHERE se.session_id = ?`,
            [sessionId]
        )

        return { ...session, exercises }
    },

    // salva il dettaglio di un esercizio nella sessione (RF-P1)
    addExercise: async (sessionId, exerciseId, setsDone, repsDone, formScore) => {
        const [result] = await db.execute(
            `INSERT INTO session_exercises (session_id, exercise_id, sets_done, reps_done, form_score)
             VALUES (?, ?, ?, ?, ?)`,
            [sessionId, exerciseId, setsDone, repsDone, formScore ?? null]
        )
        return result.insertId
    },

    // trend di un esercizio nel tempo per l'utente (RF-P5)
    getExerciseHistory: async (userId, exerciseId) => {
        const [rows] = await db.execute(
            `SELECT
                s.started_at AS date,
                se.sets_done,
                se.reps_done,
                se.form_score,
                e.name AS exercise_name
             FROM session_exercises se
             JOIN sessions s ON se.session_id = s.id
             JOIN exercises e ON se.exercise_id = e.id
             WHERE s.user_id = ? AND se.exercise_id = ?
             ORDER BY s.started_at ASC`,
            [userId, exerciseId]
        )
        return rows
    },

    // statistiche aggregate dell'utente (RF-P4)
    getStats: async (userId) => {
        const [[totals]] = await db.execute(
            `SELECT
                COUNT(DISTINCT s.id)             AS total_sessions,
                COALESCE(SUM(se.reps_done), 0)  AS total_reps,
                COALESCE(AVG(se.form_score), 0) AS avg_form_score
             FROM sessions s
             LEFT JOIN session_exercises se ON s.id = se.session_id
             WHERE s.user_id = ?`,
            [userId]
        )

        // sessioni per settimana (ultime 8 settimane)
        const [weekly] = await db.execute(
            `SELECT
                YEARWEEK(started_at, 1)  AS week,
                COUNT(*)                 AS sessions
             FROM sessions
             WHERE user_id = ? AND started_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
             GROUP BY week
             ORDER BY week`,
            [userId]
        )

        return { ...totals, weekly }
    }
}

export default Session
