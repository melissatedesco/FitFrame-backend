const mysql = require('mysql2')
require('dotenv').config()

// crea un pool di connessioni usando le variabli del file .env
const pool = mysql.createPool({
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

// testiamo subito la connessione all'avvio
pool.getConnection((err, connection) => {
    if(err) {
        console.error(" Errore di connessione al database MySQL:", err.message);
    } else {
        console.log("Connessione al database MySQL avvenuta con successo");
        // rilascia la connessione nel pool
        connection.release(); 
    }
})

module.exports = promisePool