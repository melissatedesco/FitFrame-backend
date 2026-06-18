import User from '../models/userModel.js'
import RefreshToken from '../models/refreshTokenModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_SECRET || 'super_secret_key_per_i_token_jwt'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_refresh_secret_key'

const generateAccessToken = (user) =>
    jwt.sign({ id: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' })

const generateRefreshToken = (user) =>
    jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' })

export const register = async (req, res, next) => {
    const { name, surname, email, password } = req.body
    try {
        const userExists = await User.findByEmail(email)
        if (userExists) {
            return res.status(400).json({ message: "Questa email è già stata registrata" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userId = await User.create(name, surname, email, hashedPassword)
        res.status(201).json({ message: 'Utente registrato con successo!', userId })
    } catch (error) {
        next(error)
    }
}

export const login = async (req, res, next) => {
    const { email, password } = req.body
    try {
        const user = await User.findByEmail(email)
        if (!user) {
            return res.status(401).json({ message: 'Credenziali non valide' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenziali non valide' })
        }

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        // salva il refresh token nel DB con scadenza 7 giorni
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ')
        await RefreshToken.save(user.id, refreshToken, expiresAt)

        res.json({
            message: "Login effettuato con successo",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        next(error)
    }
}

// genera un nuovo access token a partire da un refresh token valido
export const refresh = async (req, res, next) => {
    const { refreshToken } = req.body
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token mancante.' })
    }

    try {
        // verifica che il token sia valido crittograficamente
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET)

        // verifica che esista nel DB (non sia stato invalidato dal logout)
        const stored = await RefreshToken.findValid(refreshToken)
        if (!stored) {
            return res.status(401).json({ message: 'Refresh token non valido o scaduto.' })
        }

        const user = await User.findById(decoded.id)
        if (!user) {
            return res.status(401).json({ message: 'Utente non trovato.' })
        }

        // rotazione: elimina il vecchio refresh token e ne emette uno nuovo
        await RefreshToken.delete(refreshToken)
        const newRefreshToken = generateRefreshToken(user)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString().slice(0, 19).replace('T', ' ')
        await RefreshToken.save(user.id, newRefreshToken, expiresAt)

        const newAccessToken = generateAccessToken(user)
        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Refresh token non valido o scaduto.' })
        }
        next(error)
    }
}

// elimina il refresh token dal DB — il token non potrà più essere usato
export const logout = async (req, res, next) => {
    const { refreshToken } = req.body
    try {
        if (refreshToken) {
            await RefreshToken.delete(refreshToken)
        }
        res.json({ message: "Logout effettuato con successo." })
    } catch (error) {
        next(error)
    }
}
