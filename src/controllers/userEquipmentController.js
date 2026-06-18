import UserEquipment from '../models/userEquipmentModel.js'

// GET /api/users/me/equipment — attrezzi posseduti dall'utente loggato (RF-T2)
export const getMyEquipment = async (req, res, next) => {
    try {
        const equipment = await UserEquipment.getByUser(req.user.id)
        res.json(equipment)
    } catch (error) {
        next(error)
    }
}

// POST /api/users/me/equipment/:equipmentId — aggiunge un attrezzo
export const addMyEquipment = async (req, res, next) => {
    try {
        await UserEquipment.add(req.user.id, req.params.equipmentId)
        res.status(201).json({ message: 'Attrezzo aggiunto alla tua lista.' })
    } catch (error) {
        next(error)
    }
}

// DELETE /api/users/me/equipment/:equipmentId — rimuove un attrezzo
export const removeMyEquipment = async (req, res, next) => {
    try {
        const removed = await UserEquipment.remove(req.user.id, req.params.equipmentId)
        if (!removed) {
            return res.status(404).json({ message: 'Attrezzo non trovato nella tua lista.' })
        }
        res.json({ message: 'Attrezzo rimosso dalla tua lista.' })
    } catch (error) {
        next(error)
    }
}

// PUT /api/users/me/equipment — sostituisce l'intera lista in una sola chiamata (RF-T2)
export const replaceMyEquipment = async (req, res, next) => {
    const { equipment_ids } = req.body
    if (!Array.isArray(equipment_ids)) {
        return res.status(400).json({ message: 'equipment_ids deve essere un array.' })
    }
    try {
        await UserEquipment.replaceAll(req.user.id, equipment_ids)
        res.json({ message: 'Lista attrezzi aggiornata.' })
    } catch (error) {
        next(error)
    }
}
