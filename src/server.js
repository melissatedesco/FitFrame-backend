const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware globali
app.use(cors());

// AGGIUSTATO: Aggiunte le parentesi () per attivare il parsing del JSON
app.use(express.json());

// AGGIUSTATO: Sistemata la sintassi e aggiunto next() alla fine per far passare la richiesta
app.use((req, res, next) => {
    console.log(`📡 Richiesta ricevuta! Metodo: ${req.method} - URL: ${req.url}`);
    next(); // <--- Fondamentale! Dice a Express: "Ok, passa alla rotta successiva"
});

// Rotta di test di base
app.get('/', (req, res) => {
    res.json({ message: "Benvenuto nell'APP di FitFrame! Il Coach virtuale è attivo 🏋️‍♂️" });
});

// Rotte dell'autenticazione
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// AGGIUSTATO: Sostituiti gli apici singoli con i backtick `` per stampare la porta corretta
app.listen(PORT, () => {
    console.log(`✅ Server in esecuzione sulla porta ${PORT}`);
});