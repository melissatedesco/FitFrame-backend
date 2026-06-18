const isProd = process.env.NODE_ENV === 'production'

// Gestisce le rotte non trovate (404)
export const notFound = (req, res, next) => {
    const error = new Error(`Rotta non trovata: ${req.method} ${req.url}`)
    error.status = 404
    next(error)
}

// Gestore globale degli errori — deve avere esattamente 4 parametri per essere riconosciuto da Express
export const errorHandler = (err, req, res, next) => {
    const status = err.status || 500
    const message = err.message || 'Errore interno del server'

    console.error(`[${new Date().toISOString()}] ${status} - ${message}`)

    res.status(status).json({
        message,
        // in produzione nasconde lo stack trace per non esporre dettagli interni
        ...(isProd ? {} : { stack: err.stack })
    })
}
