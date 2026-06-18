import Exercise from '../models/exerciseModel.js'

export const getAllExercises = async (req, res, next) => {
    try {
        const { muscle_group, difficulty, equipment_id, my_equipment } = req.query
        const user_id = my_equipment === 'true' ? req.user?.id : null
        const exercises = await Exercise.getAll({ muscle_group, difficulty, equipment_id, user_id })
        res.json(exercises)
    } catch (e) { next(e) }
}

export const getExerciseById = async (req, res, next) => {
    try {
        const exercise = await Exercise.findById(req.params.id)
        if (!exercise) return res.status(404).json({ message: 'Esercizio non trovato.' })
        res.json(exercise)
    } catch (e) { next(e) }
}

export const createExercise = async (req, res, next) => {
    try {
        // admin crea esercizi di sistema (created_by = null), trainer li firma con il suo id
        const created_by = req.user.role === 'admin' ? null : req.user.id
        const id = await Exercise.create({ ...req.body, created_by })
        res.status(201).json({ message: 'Esercizio creato con successo.', id })
    } catch (e) { next(e) }
}

export const updateExercise = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            const isOwner = await Exercise.isOwner(req.params.id, req.user.id)
            if (!isOwner) return res.status(403).json({ message: 'Puoi modificare solo gli esercizi che hai creato.' })
        }
        const updated = await Exercise.update(req.params.id, req.body)
        if (!updated) return res.status(404).json({ message: 'Esercizio non trovato.' })
        res.json({ message: 'Esercizio aggiornato con successo.' })
    } catch (e) { next(e) }
}

export const deleteExercise = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            const isOwner = await Exercise.isOwner(req.params.id, req.user.id)
            if (!isOwner) return res.status(403).json({ message: 'Puoi eliminare solo gli esercizi che hai creato.' })
        }
        const deleted = await Exercise.delete(req.params.id)
        if (!deleted) return res.status(404).json({ message: 'Esercizio non trovato.' })
        res.json({ message: 'Esercizio eliminato.' })
    } catch (e) { next(e) }
}

export const addEquipmentToExercise = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            const isOwner = await Exercise.isOwner(req.params.id, req.user.id)
            if (!isOwner) return res.status(403).json({ message: 'Puoi modificare solo gli esercizi che hai creato.' })
        }
        await Exercise.addEquipment(req.params.id, req.params.equipmentId)
        res.json({ message: 'Attrezzo collegato all\'esercizio.' })
    } catch (e) { next(e) }
}

export const removeEquipmentFromExercise = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            const isOwner = await Exercise.isOwner(req.params.id, req.user.id)
            if (!isOwner) return res.status(403).json({ message: 'Puoi modificare solo gli esercizi che hai creato.' })
        }
        await Exercise.removeEquipment(req.params.id, req.params.equipmentId)
        res.json({ message: 'Attrezzo rimosso dall\'esercizio.' })
    } catch (e) { next(e) }
}
