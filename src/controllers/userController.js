import User from '../models/userModel.js';

// visualizza tutti gli utenti (solo admin)
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (error) {
        next(error)
    }
};

// visualizza profilo (proprio o admin su tutti)
export const getUserProfile = async (req, res, next) => {
    const targetId = req.params.id || req.user.id;

    if (req.user.role !== 'admin' && req.user.id !== parseInt(targetId)) {
        return res.status(403).json({ message: "Non sei autorizzato a visualizzare questo profilo." });
    }

    try {
        const user = await User.findById(targetId);
        if (!user) {
            return res.status(404).json({ message: "Utente non trovato." });
        }
        res.json(user);
    } catch (error) {
        next(error)
    }
};

// modifica profilo (proprio o admin)
export const updateUser = async (req, res, next) => {
    const targetId = parseInt(req.params.id);
    const { name, surname, email, password, role } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== targetId) {
        return res.status(403).json({ message: "Non puoi modificare i profili altrui." });
    }

    try {
        const updateData = { name, surname, email, password };

        if (req.user.role === 'admin' && role) {
            updateData.role = role;
        }

        const updated = await User.update(targetId, updateData);
        if (!updated) {
            return res.status(404).json({ message: "Utente non trovato o nessuna modifica effettuata." });
        }

        res.json({ message: "Profilo aggiornato con successo!" });
    } catch (error) {
        next(error)
    }
};

// elimina account (proprio o admin)
export const deleteUser = async (req, res, next) => {
    const targetId = parseInt(req.params.id);

    if (req.user.role !== 'admin' && req.user.id !== targetId) {
        return res.status(403).json({ message: "Non sei autorizzato a eliminare questo account." });
    }

    try {
        const deleted = await User.delete(targetId);
        if (!deleted) {
            return res.status(404).json({ message: "Utente non trovato. Impossibile eliminare." });
        }
        res.json({ message: "Account eliminato con successo." });
    } catch (error) {
        next(error)
    }
};
