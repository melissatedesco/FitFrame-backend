export default (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato. Riservato agli amministratori." })
    }
    next()
}
