const User = require('../models/userModel')
const bcypt = require('bcrypt')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
    console.log("ehi! ho ricevuto una richiesta su /register. Dati inviati:", req.body)
    try {
        const { name, surname, email, password} = req.body

        // validazione base
        if (!name ||!surname || !email || !password) {
            return res.status(400).json({message: "Tutti i campi sono obbligatori"})
        }

        // controlla se l'utente esiste già
        const existingUser = await User.findByEmail(email)
        if (existingUser) {
            return res.status(400).json({message: "Questa email è già stata registrata"})
        }

        // cripta la password 
        const salt = await bcypt.genSalt(10)
        const hashedPassword = await bcypt.hash(password, salt)
        
        // salva l'utente nel database
        const userId = await User.create(name, surname, email, hashedPassword)
        res.status(201).json({message: 'Utente registrato con successo!', userId})
    } catch (error) {
        console.error(error)
        res.status(500).json({message: "Errore nel server durante la registrazione"})
    }
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body
        if (!email || !password) {
            return res.status(400).json({message: 'Email e password richieste'})
        }

        // confronta la password inserita con quella criptata nel database
        const isMatch = await bcypt.compare(password, user.password)
        if (!isMatch) { 
            return res.status(401).json({message:'Credenziali non valide'})
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.NODE_ENV === 'production' ? process.env.JWT_SECRET : 'super_secret_key_per_i_token_jwt',
            {expiresIn: '4h'}
        );

        // restituiamo anche il cognome nella risposta
        res.json({
            message: "Login effettuato con successo",
            token,
            user: {
                id: user.id,
                name: user.name,
                suername : user.surname,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Errore del server durante la login'})
    }
}