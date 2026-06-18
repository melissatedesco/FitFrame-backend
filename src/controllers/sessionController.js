import Session from '../models/sessionModel.js'

// POST /api/sessions — inizia una sessione (RF-P1)
export const startSession = async (req, res, next) => {
    const { program_id } = req.body
    try {
        const startedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
        const id = await Session.create(req.user.id, program_id, startedAt)
        res.status(201).json({ message: 'Sessione avviata.', id })
    } catch (error) {
        next(error)
    }
}

// PATCH /api/sessions/:id/close — chiude la sessione (RF-P1)
export const closeSession = async (req, res, next) => {
    try {
        const endedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
        const closed = await Session.close(req.params.id, endedAt)
        if (!closed) {
            return res.status(404).json({ message: 'Sessione non trovata.' })
        }
        res.json({ message: 'Sessione completata.' })
    } catch (error) {
        next(error)
    }
}

// GET /api/sessions — storico sessioni dell'utente (RF-P2)
export const getMySessions = async (req, res, next) => {
    try {
        const sessions = await Session.getByUser(req.user.id)
        res.json(sessions)
    } catch (error) {
        next(error)
    }
}

// GET /api/sessions/:id — dettaglio singola sessione (RF-P3)
export const getSessionById = async (req, res, next) => {
    try {
        const session = await Session.findById(req.params.id)
        if (!session) {
            return res.status(404).json({ message: 'Sessione non trovata.' })
        }
        if (session.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non sei autorizzato a visualizzare questa sessione.' })
        }
        res.json(session)
    } catch (error) {
        next(error)
    }
}

// POST /api/sessions/:id/exercises — registra un esercizio eseguito (RF-P1)
export const logExercise = async (req, res, next) => {
    const { exercise_id, sets_done, reps_done, form_score } = req.body
    if (!exercise_id || sets_done == null || reps_done == null) {
        return res.status(400).json({ message: 'exercise_id, sets_done e reps_done sono obbligatori.' })
    }
    try {
        const id = await Session.addExercise(req.params.id, exercise_id, sets_done, reps_done, form_score)
        res.status(201).json({ message: 'Esercizio registrato.', id })
    } catch (error) {
        next(error)
    }
}

// GET /api/sessions/stats — statistiche aggregate (RF-P4)
export const getMyStats = async (req, res, next) => {
    try {
        const stats = await Session.getStats(req.user.id)
        res.json(stats)
    } catch (error) {
        next(error)
    }
}

// GET /api/sessions/exercises/:exerciseId/history — trend esercizio nel tempo (RF-P5)
export const getExerciseHistory = async (req, res, next) => {
    try {
        const history = await Session.getExerciseHistory(req.user.id, req.params.exerciseId)
        res.json(history)
    } catch (error) {
        next(error)
    }
}
