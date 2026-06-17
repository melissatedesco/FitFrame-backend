import Equipment from '../models/equipmentModel.js'

// visualizza tutti gli attrezzi
export const getAllEquipment = async (req, res) => {
    try {
        const list = await Equipment.getAll()
        res.json(list)
    } catch (error) {
        res.status(500).json({ message: "Errore nel recupero degli attrezzi", error: error.message })
    }
}

// visualizza attrezzo per id
export const getEquipmentById = async (req, res) => {
    try {
        const item = await Equipment.findById(req.params.id)
        if (!item) {
            return res.status(404).json({ message: "Attrezzo non trovato" })
        }
        res.json(item)
    } catch (error) {
        res.status(500).json({ message: "Errore nel recupero attrezzo", error: error.message })
    }
}

// crea attrezzo
export const createEquipment = async (req, res) => {
    const { name, category } = req.body
    try {
        const newId = await Equipment.create(name, category)
        res.status(201).json({ message: "Attrezzo aggiunto al catalogo", id: newId })
    } catch (error) {
        res.status(500).json({ message: "Errore durante la creazione", error: error.message })
    }
}

// modifica attrezzo
export const updateEquipment = async (req, res) => {
    const { id } = req.params
    const { name, category } = req.body
    try {
        const updated = await Equipment.update(id, name, category)
        if (!updated) {
            return res.status(404).json({ message: "Attrezzo non trovato o nessuna modifica effettuata" })
        }
        res.json({ message: "Attrezzo aggiornato con successo" })
    } catch (error) {
        res.status(500).json({ message: "Errore durante la modifica", error: error.message })
    }
}

// elimina attrezzo
export const deleteEquipment = async (req, res) => {
    const { id } = req.params
    try {
        const deleted = await Equipment.delete(id)
        if (!deleted) {
            return res.status(404).json({ message: "Attrezzo non trovato. Impossibile eliminare" })
        }
        res.json({ message: "Attrezzo eliminato dal catalogo con successo" })
    } catch (error) {
        res.status(500).json({ message: "Errore durante l'eliminazione", error: error.message })
    }
}
