import { createPool } from 'mysql2'
import 'dotenv/config'

// crea un pool di connessioni usando le variabili del file .env
const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
})

// esporta il pool convertito in "promises" per poter usare async/await nel codice
const promisePool = pool.promise()

// testa la connessione all'avvio
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Errore di connessione al database MySQL:", err.message)
    } else {
        console.log("Connessione al database MySQL avvenuta con successo")
        connection.release()
    }
})

export default promisePool
