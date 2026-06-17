const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Restituisce un middleware Express che valida req.body secondo le regole fornite.
// Ogni regola è { field, message, check } oppure { field, message } per "campo obbligatorio".
export const validate = (rules) => (req, res, next) => {
    for (const rule of rules) {
        const value = req.body[rule.field]
        const check = rule.check ?? ((v) => v !== undefined && v !== null && v !== '')
        if (!check(value)) {
            return res.status(400).json({ message: rule.message })
        }
    }
    next()
}

export const rules = {
    required: (field, label) => ({
        field,
        message: `${label} è obbligatorio.`
    }),
    email: (field = 'email') => ({
        field,
        message: 'Inserisci un indirizzo email valido.',
        check: (v) => v && isValidEmail(v)
    }),
    minLength: (field, len, label) => ({
        field,
        message: `${label} deve contenere almeno ${len} caratteri.`,
        check: (v) => v && v.length >= len
    })
}
