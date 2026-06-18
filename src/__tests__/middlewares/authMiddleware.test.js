import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import authMiddleware from '../../middlewares/authMiddleware.js'

const SECRET = 'super_secret_key_per_i_token_jwt'

const mockRes = () => {
    const res = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}
const mockNext = () => vi.fn()

describe('authMiddleware', () => {
    it('risponde 401 se non c\'è header Authorization', () => {
        const req = { headers: {} }
        const res = mockRes()
        const next = mockNext()

        authMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('risponde 401 se il formato non è Bearer', () => {
        const req = { headers: { authorization: 'Basic abc123' } }
        const res = mockRes()
        const next = mockNext()

        authMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('risponde 401 se il token è non valido', () => {
        const req = { headers: { authorization: 'Bearer tokenfalso' } }
        const res = mockRes()
        const next = mockNext()

        authMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('popola req.user e chiama next() con un token valido', () => {
        const payload = { id: 1, role: 'user' }
        const token = jwt.sign(payload, SECRET, { expiresIn: '1h' })

        const req = { headers: { authorization: `Bearer ${token}` } }
        const res = mockRes()
        const next = mockNext()

        authMiddleware(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        expect(req.user).toMatchObject({ id: 1, role: 'user' })
    })

    it('risponde 401 se il token è scaduto', () => {
        const token = jwt.sign({ id: 1, role: 'user' }, SECRET, { expiresIn: '0s' })

        const req = { headers: { authorization: `Bearer ${token}` } }
        const res = mockRes()
        const next = mockNext()

        authMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })
})
