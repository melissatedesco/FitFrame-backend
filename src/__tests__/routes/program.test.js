import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { json } from 'express'
import jwt from 'jsonwebtoken'
import { notFound, errorHandler } from '../../middlewares/errorMiddleware.js'

vi.mock('../../models/programModel.js', () => ({
    default: {
        getAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        isOwner: vi.fn(),
        addExercise: vi.fn(),
        updateExercise: vi.fn(),
        removeExercise: vi.fn()
    }
}))
vi.mock('../../config/db.js', () => ({ default: {} }))

import Program from '../../models/programModel.js'
import programRoutes from '../../routes/programRoutes.js'

const SECRET = 'super_secret_key_per_i_token_jwt'
const tokenUser  = jwt.sign({ id: 1, role: 'user' },  SECRET, { expiresIn: '1h' })
const tokenAdmin = jwt.sign({ id: 2, role: 'admin' }, SECRET, { expiresIn: '1h' })

const app = express()
app.use(json())
app.use('/api/programs', programRoutes)
app.use(notFound)
app.use(errorHandler)

const schedaMock = {
    id: 1, name: 'Full Body', description: 'Allenamento completo',
    user_id: 1, exercises: []
}

describe('GET /api/programs', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 401 senza token', async () => {
        const res = await request(app).get('/api/programs')
        expect(res.status).toBe(401)
    })

    it('risponde 200 con lista schede', async () => {
        Program.getAll.mockResolvedValue([schedaMock])

        const res = await request(app)
            .get('/api/programs')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
        expect(res.body[0].name).toBe('Full Body')
    })
})

describe('GET /api/programs/:id', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 404 se scheda non esiste', async () => {
        Program.findById.mockResolvedValue(null)

        const res = await request(app)
            .get('/api/programs/999')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(404)
    })

    it('risponde 200 per scheda di sistema (user_id null)', async () => {
        Program.findById.mockResolvedValue({ ...schedaMock, user_id: null })

        const res = await request(app)
            .get('/api/programs/1')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
    })

    it('risponde 403 se utente tenta di vedere la scheda di un altro', async () => {
        Program.findById.mockResolvedValue({ ...schedaMock, user_id: 99 })

        const res = await request(app)
            .get('/api/programs/1')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(403)
    })

    it('admin può vedere qualsiasi scheda', async () => {
        Program.findById.mockResolvedValue({ ...schedaMock, user_id: 99 })

        const res = await request(app)
            .get('/api/programs/1')
            .set('Authorization', `Bearer ${tokenAdmin}`)

        expect(res.status).toBe(200)
    })
})

describe('POST /api/programs', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 400 se manca il nome', async () => {
        const res = await request(app)
            .post('/api/programs')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ description: 'Senza nome' })

        expect(res.status).toBe(400)
    })

    it('risponde 201 con scheda creata', async () => {
        Program.create.mockResolvedValue(7)

        const res = await request(app)
            .post('/api/programs')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ name: 'Full Body', description: 'Allenamento completo' })

        expect(res.status).toBe(201)
        expect(res.body.id).toBe(7)
    })
})

describe('PUT /api/programs/:id', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se utente non è il proprietario', async () => {
        Program.isOwner.mockResolvedValue(false)

        const res = await request(app)
            .put('/api/programs/1')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ name: 'Modificata' })

        expect(res.status).toBe(403)
    })

    it('risponde 200 se utente è il proprietario', async () => {
        Program.isOwner.mockResolvedValue(true)
        Program.update.mockResolvedValue(true)

        const res = await request(app)
            .put('/api/programs/1')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ name: 'Full Body Modificata' })

        expect(res.status).toBe(200)
    })
})

describe('DELETE /api/programs/:id', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 403 se utente non è il proprietario', async () => {
        Program.isOwner.mockResolvedValue(false)

        const res = await request(app)
            .delete('/api/programs/1')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(403)
    })

    it('risponde 200 se admin elimina qualsiasi scheda', async () => {
        Program.isOwner.mockResolvedValue(false)
        Program.delete.mockResolvedValue(true)

        const res = await request(app)
            .delete('/api/programs/1')
            .set('Authorization', `Bearer ${tokenAdmin}`)

        expect(res.status).toBe(200)
    })
})

describe('POST /api/programs/:id/exercises', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 400 se mancano exercise_id o position', async () => {
        Program.isOwner.mockResolvedValue(true)

        const res = await request(app)
            .post('/api/programs/1/exercises')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ sets: 3 })

        expect(res.status).toBe(400)
    })

    it('risponde 201 con esercizio aggiunto', async () => {
        Program.isOwner.mockResolvedValue(true)
        Program.addExercise.mockResolvedValue(15)

        const res = await request(app)
            .post('/api/programs/1/exercises')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ exercise_id: 3, position: 1, sets: 3, reps: 10, rest_seconds: 60 })

        expect(res.status).toBe(201)
        expect(res.body.id).toBe(15)
    })
})
