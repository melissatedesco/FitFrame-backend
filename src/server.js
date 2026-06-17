import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import db from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import programRoutes from './routes/programRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// header di sicurezza HTTP (RNF-3)
app.use(helmet());

// CORS limitato alle origini autorizzate — no wildcard (RNF-3)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({
    origin: (origin, callback) => {
        // permette richieste senza origin (es. Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Origine non autorizzata dal CORS.'))
        }
    },
    credentials: true
}));

app.use(json());

app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.json({ message: "Benvenuto nell'APP di FitFrame! Il Coach virtuale è attivo 🏋️‍♂️" });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/sessions', sessionRoutes);

// gestione rotte non trovate e errori globali — devono stare DOPO tutte le rotte
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`✅ Server in esecuzione sulla porta ${PORT}`);
});
