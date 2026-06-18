import { describe, it, expect, vi } from 'vitest'
import { validate, rules } from '../../middlewares/validate.js'

const mockReq = (body) => ({ body })
const mockRes = () => {
    const res = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}
const mockNext = () => vi.fn()

describe('validate middleware', () => {
    it('chiama next() se tutti i campi sono validi', () => {
        const req = mockReq({ name: 'Mario', email: 'mario@test.com' })
        const res = mockRes()
        const next = mockNext()

        validate([rules.required('name', 'Nome'), rules.email()])(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('risponde 400 se un campo obbligatorio è mancante', () => {
        const req = mockReq({ email: 'mario@test.com' })
        const res = mockRes()
        const next = mockNext()

        validate([rules.required('name', 'Nome')])(req, res, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'Nome è obbligatorio.' })
        expect(next).not.toHaveBeenCalled()
    })

    it('risponde 400 se email non è valida', () => {
        const req = mockReq({ email: 'non-una-email' })
        const res = mockRes()
        const next = mockNext()

        validate([rules.email()])(req, res, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'Inserisci un indirizzo email valido.' })
        expect(next).not.toHaveBeenCalled()
    })

    it('risponde 400 se la password è troppo corta', () => {
        const req = mockReq({ password: '123' })
        const res = mockRes()
        const next = mockNext()

        validate([rules.minLength('password', 6, 'Password')])(req, res, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(next).not.toHaveBeenCalled()
    })

    it('accetta una password che rispetta la lunghezza minima', () => {
        const req = mockReq({ password: 'sicura123' })
        const res = mockRes()
        const next = mockNext()

        validate([rules.minLength('password', 6, 'Password')])(req, res, next)

        expect(next).toHaveBeenCalledOnce()
    })
})
