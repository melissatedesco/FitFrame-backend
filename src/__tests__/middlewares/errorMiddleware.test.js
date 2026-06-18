import { describe, it, expect, vi } from 'vitest'
import { notFound, errorHandler } from '../../middlewares/errorMiddleware.js'

const mockRes = () => {
    const res = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}
const mockNext = () => vi.fn()

describe('notFound middleware', () => {
    it('passa un errore 404 a next()', () => {
        const req = { method: 'GET', url: '/api/nonesiste' }
        const res = mockRes()
        const next = mockNext()

        notFound(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        const err = next.mock.calls[0][0]
        expect(err).toBeInstanceOf(Error)
        expect(err.status).toBe(404)
    })
})

describe('errorHandler middleware', () => {
    it('risponde con lo status e il messaggio dell\'errore', () => {
        const err = new Error('Qualcosa è andato storto')
        err.status = 422
        const req = {}
        const res = mockRes()
        const next = mockNext()

        errorHandler(err, req, res, next)

        expect(res.status).toHaveBeenCalledWith(422)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Qualcosa è andato storto' })
        )
    })

    it('usa 500 come status di default se err.status non è impostato', () => {
        const err = new Error('Errore generico')
        const req = {}
        const res = mockRes()
        const next = mockNext()

        errorHandler(err, req, res, next)

        expect(res.status).toHaveBeenCalledWith(500)
    })
})
