import jwt from 'jsonwebtoken'

export default (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Accesso negato. Token mancante.' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_per_i_token_jwt')
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Token non valido o scaduto.' })
    }
}
