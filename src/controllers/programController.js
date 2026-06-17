import Program from '../models/programModel.js'

// GET /api/programs — schede di sistema + proprie (RF-S1, S2)
export const getAllPrograms = async (req, res, next) => {
    try {
        const programs = await Program.getAll(req.user.id)
        res.json(programs)
    } catch (error) {
        next(error)
    }
}

// GET /api/programs/:id — dettaglio con esercizi
export const getProgramById = async (req, res, next) => {
    try {
        const program = await Program.findById(req.params.id)
        if (!program) {
            return res.status(404).json({ message: 'Scheda non trovata.' })
        }
        // le schede di sistema sono visibili a tutti; quelle personali solo al proprietario o admin
        if (program.user_id && program.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non sei autorizzato a visualizzare questa scheda.' })
        }
        res.json(program)
    } catch (error) {
        next(error)
    }
}

// POST /api/programs — crea scheda personale (RF-S2)
export const createProgram = async (req, res, next) => {
    const { name, description } = req.body
    // gli admin possono creare schede di sistema passando user_id: null
    const userId = req.user.role === 'admin' ? (req.body.user_id ?? req.user.id) : req.user.id
    try {
        const id = await Program.create(name, description, userId)
        res.status(201).json({ message: 'Scheda creata con successo.', id })
    } catch (error) {
        next(error)
    }
}

// PUT /api/programs/:id — modifica scheda (RF-S5)
export const updateProgram = async (req, res, next) => {
    const { name, description } = req.body
    try {
        const isOwner = await Program.isOwner(req.params.id, req.user.id)
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non puoi modificare questa scheda.' })
        }
        const updated = await Program.update(req.params.id, name, description)
        if (!updated) {
            return res.status(404).json({ message: 'Scheda non trovata.' })
        }
        res.json({ message: 'Scheda aggiornata.' })
    } catch (error) {
        next(error)
    }
}

// DELETE /api/programs/:id — elimina scheda (RF-S5)
export const deleteProgram = async (req, res, next) => {
    try {
        const isOwner = await Program.isOwner(req.params.id, req.user.id)
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non puoi eliminare questa scheda.' })
        }
        const deleted = await Program.delete(req.params.id)
        if (!deleted) {
            return res.status(404).json({ message: 'Scheda non trovata.' })
        }
        res.json({ message: 'Scheda eliminata.' })
    } catch (error) {
        next(error)
    }
}

// POST /api/programs/:id/exercises — aggiunge esercizio alla scheda (RF-S3)
export const addExercise = async (req, res, next) => {
    const { exercise_id, position, sets = 3, reps = 10, rest_seconds = 60 } = req.body
    if (!exercise_id || !position) {
        return res.status(400).json({ message: 'exercise_id e position sono obbligatori.' })
    }
    try {
        const isOwner = await Program.isOwner(req.params.id, req.user.id)
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non puoi modificare questa scheda.' })
        }
        const id = await Program.addExercise(req.params.id, exercise_id, position, sets, reps, rest_seconds)
        res.status(201).json({ message: 'Esercizio aggiunto alla scheda.', id })
    } catch (error) {
        next(error)
    }
}

// PUT /api/programs/:id/exercises/:peId — modifica parametri esercizio (RF-S4)
export const updateExercise = async (req, res, next) => {
    const { position, sets, reps, rest_seconds } = req.body
    try {
        const isOwner = await Program.isOwner(req.params.id, req.user.id)
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non puoi modificare questa scheda.' })
        }
        const updated = await Program.updateExercise(req.params.peId, { position, sets, reps, rest_seconds })
        if (!updated) {
            return res.status(404).json({ message: 'Esercizio non trovato nella scheda.' })
        }
        res.json({ message: 'Esercizio aggiornato.' })
    } catch (error) {
        next(error)
    }
}

// DELETE /api/programs/:id/exercises/:peId — rimuove esercizio (RF-S3)
export const removeExercise = async (req, res, next) => {
    try {
        const isOwner = await Program.isOwner(req.params.id, req.user.id)
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non puoi modificare questa scheda.' })
        }
        const removed = await Program.removeExercise(req.params.peId)
        if (!removed) {
            return res.status(404).json({ message: 'Esercizio non trovato nella scheda.' })
        }
        res.json({ message: 'Esercizio rimosso dalla scheda.' })
    } catch (error) {
        next(error)
    }
}
