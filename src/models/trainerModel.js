import db from '../config/db.js'

const Trainer = {

    // lista clienti del trainer con stats aggregate
    getClients: async (trainerId) => {
        const [rows] = await db.execute(
            `SELECT u.id, u.name, u.email, tc.assigned_at,
                    COUNT(DISTINCT s.id)             AS total_sessions,
                    COALESCE(SUM(se.reps_done), 0)  AS total_reps,
                    COALESCE(AVG(se.form_score), 0) AS avg_form_score,
                    MAX(s.started_at)                AS last_session
             FROM trainer_clients tc
             JOIN users u ON tc.client_id = u.id
             LEFT JOIN sessions s ON s.user_id = u.id
             LEFT JOIN session_exercises se ON se.session_id = s.id
             WHERE tc.trainer_id = ?
             GROUP BY u.id, u.name, u.email, tc.assigned_at`,
            [trainerId]
        )
        return rows
    },

    // aggiunge un cliente (per email)
    addClientByEmail: async (trainerId, email) => {
        // trova l'utente
        const [[user]] = await db.execute(
            `SELECT id, name, email, role FROM users WHERE email = ?`,
            [email]
        )
        if (!user) return { error: 'Utente non trovato.' }
        if (user.role === 'admin') return { error: 'Non puoi aggiungere un amministratore come cliente.' }

        // controlla se ha già un trainer
        const [[existing]] = await db.execute(
            `SELECT trainer_id FROM trainer_clients WHERE client_id = ?`,
            [user.id]
        )
        if (existing) {
            if (existing.trainer_id === trainerId) return { error: 'Questo utente è già tuo cliente.' }
            return { error: 'Questo utente è già associato a un altro trainer.' }
        }

        await db.execute(
            `INSERT INTO trainer_clients (trainer_id, client_id) VALUES (?, ?)`,
            [trainerId, user.id]
        )
        return { client: { id: user.id, name: user.name, email: user.email } }
    },

    // rimuove un cliente
    removeClient: async (trainerId, clientId) => {
        const [result] = await db.execute(
            `DELETE FROM trainer_clients WHERE trainer_id = ? AND client_id = ?`,
            [trainerId, clientId]
        )
        return result.affectedRows > 0
    },

    // verifica che il cliente appartenga al trainer
    isMyClient: async (trainerId, clientId) => {
        const [[row]] = await db.execute(
            `SELECT 1 FROM trainer_clients WHERE trainer_id = ? AND client_id = ?`,
            [trainerId, clientId]
        )
        return !!row
    },

    // stats dettagliate di un singolo cliente
    getClientStats: async (clientId) => {
        const [[totals]] = await db.execute(
            `SELECT
                COUNT(DISTINCT s.id)             AS total_sessions,
                COALESCE(SUM(se.reps_done), 0)  AS total_reps,
                COALESCE(AVG(se.form_score), 0) AS avg_form_score
             FROM sessions s
             LEFT JOIN session_exercises se ON s.id = se.session_id
             WHERE s.user_id = ?`,
            [clientId]
        )
        const [weekly] = await db.execute(
            `SELECT YEARWEEK(started_at, 1) AS week, COUNT(*) AS sessions
             FROM sessions
             WHERE user_id = ? AND started_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
             GROUP BY week ORDER BY week`,
            [clientId]
        )
        return { ...totals, weekly }
    },

    // sessioni di un cliente (ultime 20)
    getClientSessions: async (clientId) => {
        const [rows] = await db.execute(
            `SELECT s.id, s.started_at, s.ended_at, s.notes,
                    p.name AS program_name,
                    COUNT(se.id) AS exercises_done
             FROM sessions s
             LEFT JOIN programs p ON s.program_id = p.id
             LEFT JOIN session_exercises se ON se.session_id = s.id
             WHERE s.user_id = ?
             GROUP BY s.id, s.started_at, s.ended_at, s.notes, p.name
             ORDER BY s.started_at DESC
             LIMIT 20`,
            [clientId]
        )
        return rows
    },

    // assegna un programma a un cliente
    assignProgram: async (trainerId, clientId, programId) => {
        // evita duplicati
        const [[existing]] = await db.execute(
            `SELECT id FROM program_assignments WHERE program_id = ? AND client_id = ?`,
            [programId, clientId]
        )
        if (existing) return { error: 'Programma già assegnato a questo cliente.' }

        const [result] = await db.execute(
            `INSERT INTO program_assignments (program_id, client_id, trainer_id) VALUES (?, ?, ?)`,
            [programId, clientId, trainerId]
        )
        return { id: result.insertId }
    },

    // rimuove un'assegnazione
    removeAssignment: async (trainerId, assignmentId) => {
        const [result] = await db.execute(
            `DELETE FROM program_assignments WHERE id = ? AND trainer_id = ?`,
            [assignmentId, trainerId]
        )
        return result.affectedRows > 0
    },

    // panoramica rapida di tutti i clienti (attivi/inattivi questa settimana)
    getOverview: async (trainerId) => {
        const [rows] = await db.execute(
            `SELECT u.id, u.name, u.email,
                    COUNT(DISTINCT s.id)                                         AS total_sessions,
                    COALESCE(AVG(se.form_score), 0)                             AS avg_form_score,
                    MAX(s.started_at)                                            AS last_session,
                    SUM(CASE WHEN s.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                             THEN 1 ELSE 0 END)                                  AS sessions_this_week
             FROM trainer_clients tc
             JOIN users u ON tc.client_id = u.id
             LEFT JOIN sessions s  ON s.user_id = u.id
             LEFT JOIN session_exercises se ON se.session_id = s.id
             WHERE tc.trainer_id = ?
             GROUP BY u.id, u.name, u.email
             ORDER BY last_session DESC`,
            [trainerId]
        )
        return rows
    },

    // progressi dettagliati di un cliente
    getClientProgress: async (clientId) => {
        // trend form score + reps settimana per settimana (ultime 8)
        const [weeklyTrend] = await db.execute(
            `SELECT
                YEARWEEK(s.started_at, 1)       AS week,
                DATE_FORMAT(MIN(s.started_at), '%d/%m') AS label,
                COUNT(DISTINCT s.id)            AS sessions,
                COALESCE(SUM(se.reps_done), 0)  AS total_reps,
                COALESCE(AVG(se.form_score), 0) AS avg_form_score
             FROM sessions s
             LEFT JOIN session_exercises se ON se.session_id = s.id
             WHERE s.user_id = ?
               AND s.started_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
             GROUP BY week
             ORDER BY week`,
            [clientId]
        )

        // muscoli più allenati
        const [muscles] = await db.execute(
            `SELECT e.muscle_group,
                    COUNT(*)                     AS sets_done,
                    COALESCE(SUM(se.reps_done),0) AS total_reps,
                    COALESCE(AVG(se.form_score),0) AS avg_form_score
             FROM sessions s
             JOIN session_exercises se ON se.session_id = s.id
             JOIN exercises e ON e.id = se.exercise_id
             WHERE s.user_id = ?
             GROUP BY e.muscle_group
             ORDER BY sets_done DESC
             LIMIT 6`,
            [clientId]
        )

        // top 5 esercizi per forma
        const [topExercises] = await db.execute(
            `SELECT e.name, e.muscle_group,
                    COUNT(*)                      AS times_done,
                    COALESCE(AVG(se.form_score),0) AS avg_form_score
             FROM sessions s
             JOIN session_exercises se ON se.session_id = s.id
             JOIN exercises e ON e.id = se.exercise_id
             WHERE s.user_id = ? AND se.form_score IS NOT NULL
             GROUP BY e.id, e.name, e.muscle_group
             ORDER BY avg_form_score DESC
             LIMIT 5`,
            [clientId]
        )

        // aderenza: sessioni svolte vs attese (basato sui programmi assegnati)
        const [[adherence]] = await db.execute(
            `SELECT
                COUNT(DISTINCT s.id)  AS sessions_done,
                COALESCE(
                    (SELECT SUM(p.sessions_per_week) * TIMESTAMPDIFF(WEEK, MIN(pa.assigned_at), NOW())
                     FROM program_assignments pa
                     JOIN programs p ON pa.program_id = p.id
                     WHERE pa.client_id = ? AND p.sessions_per_week IS NOT NULL),
                0) AS sessions_expected
             FROM sessions s
             WHERE s.user_id = ?`,
            [clientId, clientId]
        )

        const adherenceRate = adherence.sessions_expected > 0
            ? Math.min(100, Math.round((adherence.sessions_done / adherence.sessions_expected) * 100))
            : null

        return { weeklyTrend, muscles, topExercises, adherence: { ...adherence, rate: adherenceRate } }
    },

    // programmi assegnati a un cliente
    getClientAssignments: async (clientId) => {
        const [rows] = await db.execute(
            `SELECT pa.id AS assignment_id, pa.assigned_at,
                    p.id, p.name, p.difficulty, p.duration_weeks, p.sessions_per_week
             FROM program_assignments pa
             JOIN programs p ON pa.program_id = p.id
             WHERE pa.client_id = ?
             ORDER BY pa.assigned_at DESC`,
            [clientId]
        )
        return rows
    },
}

export default Trainer
