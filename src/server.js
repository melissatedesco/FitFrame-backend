import express, { json } from 'express';
import cors from 'cors';
import 'dotenv/config';
import db from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(json());

app.use((req, res, next) => {
    console.log(`📡 Richiesta ricevuta! Metodo: ${req.method} - URL: ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.json({ message: "Benvenuto nell'APP di FitFrame! Il Coach virtuale è attivo 🏋️‍♂️" });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipment', equipmentRoutes);

app.listen(PORT, () => {
    console.log(`✅ Server in esecuzione sulla porta ${PORT}`);
});
