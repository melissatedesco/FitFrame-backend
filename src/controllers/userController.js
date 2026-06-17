import User from '../models/userModel.js';

// 1. READ ALL - Visualizza tutti gli utenti (Solo per l'Admin)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Errore nel recupero degli utenti.", error: error.message });
    }
};

// 2. READ ONE - Visualizza il profilo (User sul proprio, Admin su tutti)
export const getUserProfile = async (req, res) => {
    // Se non c'è un ID nell'URL (es. /api/users/profilo), prende l'ID dell'utente loggato dal JWT
    const targetId = req.params.id || req.user.id; 

    // 🔒 Sicurezza: Se non sei admin e provi a vedere l'ID di un altro, vieni bloccato
    if (req.user.role !== 'admin' && req.user.id !== parseInt(targetId)) {
        return res.status(403).json({ message: "Non sei autorizzato a visualizzare questo profilo. 🚫" });
    }

    try {
        const user = await User.findById(targetId);
        if (!user) {
            return res.status(404).json({ message: "Utente non trovato." });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Errore nel recupero del profilo.", error: error.message });
    }
};

// 3. UPDATE - Modifica profilo (RF-A4)
export const updateUser = async (req, res) => {
    const targetId = parseInt(req.params.id);
    const { name, surname, email, password, role } = req.body;

    if (!name || !surname || !email) {
        return res.status(400).json({ message: "Nome, cognome ed email sono obbligatori." });
    }

    // 🔒 Sicurezza: Puoi modificare solo te stesso, a meno che tu non sia Admin
    if (req.user.role !== 'admin' && req.user.id !== targetId) {
        return res.status(403).json({ message: "Non puoi modificare i profili altrui. 🚫" });
    }

    try {
        const updateData = { name, surname, email, password };
        
        // Solo l'admin può cambiare il ruolo (role) di un utente
        if (req.user.role === 'admin' && role) {
            updateData.role = role;
        }

        const updated = await User.update(targetId, updateData);
        if (!updated) {
            return res.status(404).json({ message: "Utente non trovato o nessuna modifica effettuata." });
        }

        res.json({ message: "Profilo aggiornato con successo! 🔄" });
    } catch (error) {
        res.status(500).json({ message: "Errore durante l'aggiornamento.", error: error.message });
    }
};

// 4. DELETE - Elimina account (RF-A5)
export const deleteUser = async (req, res) => {
    const targetId = parseInt(req.params.id);

    // 🔒 Sicurezza: Puoi eliminare solo te stesso, a meno che tu non sia Admin
    if (req.user.role !== 'admin' && req.user.id !== targetId) {
        return res.status(403).json({ message: "Non sei autorizzato a eliminare questo account. 🚫" });
    }

    try {
        const deleted = await User.delete(targetId);
        if (!deleted) {
            return res.status(404).json({ message: "Utente non trovato. Impossibile eliminare." });
        }
        res.json({ message: "Account eliminato con successo. 🗑️" });
    } catch (error) {
        res.status(500).json({ message: "Errore durante l'eliminazione.", error: error.message });
    }
};