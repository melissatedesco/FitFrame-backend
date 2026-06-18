import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { json } from 'express'
import jwt from 'jsonwebtoken'
import { notFound, errorHandler } from '../../middlewares/errorMiddleware.js'

vi.mock('../../models/equipmentModel.js', () => ({
    default: {
        getAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }
}))
vi.mock('../../config/db.js', () => ({ default: {} }))

import Equipment from '../../models/equipmentModel.js'
import equipmentRoutes from '../../routes/equipmentRoutes.js'

const SECRET = 'super_secret_key_per_i_token_jwt'
const tokenUser  = jwt.sign({ id: 1, role: 'user' },  SECRET, { expiresIn: '1h' })
const tokenAdmin = jwt.sign({ id: 2, role: 'admin' }, SECRET, { expiresIn: '1h' })

const app = express()
app.use(json())
app.use('/api/equipment', equipmentRoutes)
app.use(notFound)
app.use(errorHandler)

describe('GET /api/equipment', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 401 senza token', async () => {
        const res = await request(app).get('/api/equipment')
        expect(res.status).toBe(401)
    })

    it('risponde 200 con lista attrezzi per utente autenticato', async () => {
        Equipment.getAll.mockResolvedValue([
            { id: 1, name: 'Manubri', category: 'pesi' }
        ])

        const res = await request(app)
            .get('/api/equipment')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
        expect(res.body[0].name).toBe('Manubri')
    })
})

describe('POST /api/equipment', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se utente non è admin', async () => {
        const res = await request(app)
            .post('/api/equipment')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ name: 'Kettlebell', category: 'pesi' })

        expect(res.status).toBe(403)
    })

    it('risponde 400 se mancano campi obbligatori', async () => {
        const res = await request(app)
            .post('/api/equipment')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ name: 'Kettlebell' })

        expect(res.status).toBe(400)
    })

    it('risponde 201 se admin crea attrezzo correttamente', async () => {
        Equipment.create.mockResolvedValue(5)

        const res = await request(app)
            .post('/api/equipment')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ name: 'Kettlebell', category: 'pesi' })

        expect(res.status).toBe(201)
        expect(res.body.id).toBe(5)
    })
})

describe('DELETE /api/equipment/:id', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se utente non è admin', async () => {
        const res = await request(app)
            .delete('/api/equipment/1')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(403)
    })

    it('risponde 404 se attrezzo non esiste', async () => {
        Equipment.delete.mockResolvedValue(false)

        const res = await request(app)
            .delete('/api/equipment/999')
            .set('Authorization', `Bearer ${tokenAdmin}`)

        expect(res.status).toBe(404)
    })

    it('risponde 200 se admin elimina attrezzo esistente', async () => {
        Equipment.delete.mockResolvedValue(true)

        const res = await request(app)
            .delete('/api/equipment/1')
            .set('Authorization', `Bearer ${tokenAdmin}`)

        expect(res.status).toBe(200)
    })
})
