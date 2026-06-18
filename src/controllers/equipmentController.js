import Equipment from '../models/equipmentModel.js'

export const getAllEquipment = async (req, res, next) => {
    try {
        const list = await Equipment.getAll()
        res.json(list)
    } catch (error) {
        next(error)
    }
}

export const getEquipmentById = async (req, res, next) => {
    try {
        const item = await Equipment.findById(req.params.id)
        if (!item) {
            return res.status(404).json({ message: "Attrezzo non trovato" })
        }
        res.json(item)
    } catch (error) {
        next(error)
    }
}

export const createEquipment = async (req, res, next) => {
    const { name, category } = req.body
    try {
        const newId = await Equipment.create(name, category)
        res.status(201).json({ message: "Attrezzo aggiunto al catalogo", id: newId })
    } catch (error) {
        next(error)
    }
}

export const updateEquipment = async (req, res, next) => {
    const { id } = req.params
    const { name, category } = req.body
    try {
        const updated = await Equipment.update(id, name, category)
        if (!updated) {
            return res.status(404).json({ message: "Attrezzo non trovato o nessuna modifica effettuata" })
        }
        res.json({ message: "Attrezzo aggiornato con successo" })
    } catch (error) {
        next(error)
    }
}

export const deleteEquipment = async (req, res, next) => {
    const { id } = req.params
    try {
        const deleted = await Equipment.delete(id)
        if (!deleted) {
            return res.status(404).json({ message: "Attrezzo non trovato. Impossibile eliminare" })
        }
        res.json({ message: "Attrezzo eliminato dal catalogo con successo" })
    } catch (error) {
        next(error)
    }
}
