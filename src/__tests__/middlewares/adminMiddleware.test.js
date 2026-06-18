import { describe, it, expect, vi } from 'vitest'
import adminMiddleware from '../../middlewares/adminMiddleware.js'

const mockRes = () => {
    const res = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}
const mockNext = () => vi.fn()

describe('adminMiddleware', () => {
    it('chiama next() se l\'utente è admin', () => {
        const req = { user: { id: 1, role: 'admin' } }
        const res = mockRes()
        const next = mockNext()

        adminMiddleware(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('risponde 403 se l\'utente è user normale', () => {
        const req = { user: { id: 2, role: 'user' } }
        const res = mockRes()
        const next = mockNext()

        adminMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })

    it('risponde 403 se req.user è assente', () => {
        const req = {}
        const res = mockRes()
        const next = mockNext()

        adminMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })
})
