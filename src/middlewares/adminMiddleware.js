module.exports = (req, res, next) => {
    // req.user viene riempito dal middleware 'protect' che abbiamo fatto prima
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: "Accesso negato. Questa operazione è riservata agli amministratori. 🚫" 
        });
    }
    
    // Se è un admin, la catena di montaggio continua
    next();
};