import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { json } from 'express'
import jwt from 'jsonwebtoken'
import { notFound, errorHandler } from '../../middlewares/errorMiddleware.js'

vi.mock('../../models/sessionModel.js', () => ({
    default: {
        create: vi.fn(),
        close: vi.fn(),
        getByUser: vi.fn(),
        findById: vi.fn(),
        addExercise: vi.fn(),
        getStats: vi.fn()
    }
}))
vi.mock('../../config/db.js', () => ({ default: {} }))

import Session from '../../models/sessionModel.js'
import sessionRoutes from '../../routes/sessionRoutes.js'

const SECRET = 'super_secret_key_per_i_token_jwt'
const tokenUser  = jwt.sign({ id: 1, role: 'user' }, SECRET, { expiresIn: '1h' })
const tokenAdmin = jwt.sign({ id: 2, role: 'admin' }, SECRET, { expiresIn: '1h' })

const app = express()
app.use(json())
app.use('/api/sessions', sessionRoutes)
app.use(notFound)
app.use(errorHandler)

const sessioneMock = {
    id: 1, user_id: 1, started_at: '2026-06-17 10:00:00',
    ended_at: null, program_name: null, exercises: []
}

describe('POST /api/sessions', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 401 senza token', async () => {
        const res = await request(app).post('/api/sessions').send({})
        expect(res.status).toBe(401)
    })

    it('risponde 201 e avvia la sessione', async () => {
        Session.create.mockResolvedValue(1)

        const res = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ program_id: 2 })

        expect(res.status).toBe(201)
        expect(res.body.id).toBe(1)
        expect(Session.create).toHaveBeenCalledWith(1, 2, expect.any(String))
    })

    it('accetta sessione senza program_id (allenamento libero)', async () => {
        Session.create.mockResolvedValue(2)

        const res = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({})

        expect(res.status).toBe(201)
        expect(Session.create).toHaveBeenCalledWith(1, undefined, expect.any(String))
    })
})

describe('PATCH /api/sessions/:id/close', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 404 se sessione non esiste', async () => {
        Session.close.mockResolvedValue(false)

        const res = await request(app)
            .patch('/api/sessions/999/close')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(404)
    })

    it('risponde 200 e chiude la sessione', async () => {
        Session.close.mockResolvedValue(true)

        const res = await request(app)
            .patch('/api/sessions/1/close')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
    })
})

describe('GET /api/sessions', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 200 con storico sessioni dell\'utente', async () => {
        Session.getByUser.mockResolvedValue([sessioneMock])

        const res = await request(app)
            .get('/api/sessions')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
        expect(Session.getByUser).toHaveBeenCalledWith(1)
    })
})

describe('GET /api/sessions/:id', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 404 se sessione non esiste', async () => {
        Session.findById.mockResolvedValue(null)

        const res = await request(app)
            .get('/api/sessions/999')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(404)
    })

    it('risponde 403 se utente tenta di vedere la sessione di un altro', async () => {
        Session.findById.mockResolvedValue({ ...sessioneMock, user_id: 99 })

        const res = await request(app)
            .get('/api/sessions/1')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(403)
    })

    it('risponde 200 con dettaglio sessione propria', async () => {
        Session.findById.mockResolvedValue(sessioneMock)

        const res = await request(app)
            .get('/api/sessions/1')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body.id).toBe(1)
    })

    it('admin può vedere la sessione di qualsiasi utente', async () => {
        Session.findById.mockResolvedValue({ ...sessioneMock, user_id: 99 })

        const res = await request(app)
            .get('/api/sessions/1')
            .set('Authorization', `Bearer ${tokenAdmin}`)

        expect(res.status).toBe(200)
    })
})

describe('POST /api/sessions/:id/exercises', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 400 se mancano campi obbligatori', async () => {
        const res = await request(app)
            .post('/api/sessions/1/exercises')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ exercise_id: 1 })

        expect(res.status).toBe(400)
    })

    it('risponde 201 con esercizio registrato', async () => {
        Session.addExercise.mockResolvedValue(10)

        const res = await request(app)
            .post('/api/sessions/1/exercises')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ exercise_id: 3, sets_done: 3, reps_done: 12, form_score: 85 })

        expect(res.status).toBe(201)
        expect(res.body.id).toBe(10)
    })
})

describe('GET /api/sessions/stats', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 200 con statistiche aggregate', async () => {
        Session.getStats.mockResolvedValue({
            total_sessions: 10, total_reps: 500,
            avg_form_score: 82.5, weekly: []
        })

        const res = await request(app)
            .get('/api/sessions/stats')
            .set('Authorization', `Bearer ${tokenUser}`)

        expect(res.status).toBe(200)
        expect(res.body.total_sessions).toBe(10)
        expect(res.body).toHaveProperty('weekly')
    })
})
