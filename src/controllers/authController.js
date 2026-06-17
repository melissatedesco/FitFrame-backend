import User from '../models/userModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// registrazione di un nuovo utente
export const register = async (req, res) => {
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
        console.error(error)
        res.status(500).json({ message: "Errore nel server durante la registrazione", error: error.message })
    }
}

// login utente esistente con generazione del jwt token
export const login = async (req, res) => {
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

        // genera il token jwt con id e ruolo dell'utente, scadenza 4 ore
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'super_secret_key_per_i_token_jwt',
            { expiresIn: '4h' }
        )

        res.json({
            message: "Login effettuato con successo",
            token,
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore durante la login', error: error.message })
    }
}

// In un'architettura JWT stateless il logout invalida il token solo lato client
export const logout = (req, res) => {
    res.json({ message: "Logout effettuato. Elimina il token lato client." })
}
