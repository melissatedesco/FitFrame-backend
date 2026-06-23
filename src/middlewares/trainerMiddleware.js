export default (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Non autenticato.' })
    if (req.user.role === 'admin' || req.user.role === 'trainer') return next()
    return res.status(403).json({ message: 'Accesso negato. Riservato ai trainer.' })
}
