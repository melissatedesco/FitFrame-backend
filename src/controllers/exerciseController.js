import Exercise from '../models/exerciseModel.js'

// GET /api/exercises — lista con filtri opzionali (RF-E1, RF-E2)
// query params: ?muscle_group=&difficulty=&equipment_id=&my_equipment=true
export const getAllExercises = async (req, res, next) => {
    try {
        const { muscle_group, difficulty, equipment_id, my_equipment } = req.query
        const user_id = my_equipment === 'true' ? req.user?.id : null

        const exercises = await Exercise.getAll({ muscle_group, difficulty, equipment_id, user_id })
        res.json(exercises)
    } catch (error) {
        next(error)
    }
}

// GET /api/exercises/:id — dettaglio con attrezzi e regole d'angolo (RF-E3, RF-E4)
export const getExerciseById = async (req, res, next) => {
    try {
        const exercise = await Exercise.findById(req.params.id)
        if (!exercise) {
            return res.status(404).json({ message: 'Esercizio non trovato.' })
        }
        res.json(exercise)
    } catch (error) {
        next(error)
    }
}

// POST /api/exercises — solo admin (RF-E5)
export const createExercise = async (req, res, next) => {
    try {
        const id = await Exercise.create(req.body)
        res.status(201).json({ message: 'Esercizio creato con successo.', id })
    } catch (error) {
        next(error)
    }
}

// PUT /api/exercises/:id — solo admin (RF-E5)
export const updateExercise = async (req, res, next) => {
    try {
        const updated = await Exercise.update(req.params.id, req.body)
        if (!updated) {
            return res.status(404).json({ message: 'Esercizio non trovato.' })
        }
        res.json({ message: 'Esercizio aggiornato con successo.' })
    } catch (error) {
        next(error)
    }
}

// DELETE /api/exercises/:id — solo admin (RF-E5)
export const deleteExercise = async (req, res, next) => {
    try {
        const deleted = await Exercise.delete(req.params.id)
        if (!deleted) {
            return res.status(404).json({ message: 'Esercizio non trovato.' })
        }
        res.json({ message: 'Esercizio eliminato.' })
    } catch (error) {
        next(error)
    }
}

// POST /api/exercises/:id/equipment/:equipmentId — solo admin
export const addEquipmentToExercise = async (req, res, next) => {
    try {
        await Exercise.addEquipment(req.params.id, req.params.equipmentId)
        res.json({ message: 'Attrezzo collegato all\'esercizio.' })
    } catch (error) {
        next(error)
    }
}

// DELETE /api/exercises/:id/equipment/:equipmentId — solo admin
export const removeEquipmentFromExercise = async (req, res, next) => {
    try {
        await Exercise.removeEquipment(req.params.id, req.params.equipmentId)
        res.json({ message: 'Attrezzo rimosso dall\'esercizio.' })
    } catch (error) {
        next(error)
    }
}
