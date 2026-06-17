import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { json } from 'express'
import { notFound, errorHandler } from '../../middlewares/errorMiddleware.js'

// mock dei moduli che accedono al DB
vi.mock('../../models/userModel.js', () => ({
    default: {
        findByEmail: vi.fn(),
        create: vi.fn(),
        findById: vi.fn()
    }
}))
vi.mock('../../models/refreshTokenModel.js', () => ({
    default: {
        save: vi.fn(),
        findValid: vi.fn(),
        delete: vi.fn()
    }
}))

import User from '../../models/userModel.js'
import RefreshToken from '../../models/refreshTokenModel.js'
import authRoutes from '../../routes/authRoutes.js'

const app = express()
app.use(json())
app.use('/api/auth', authRoutes)
app.use(notFound)
app.use(errorHandler)

describe('POST /api/auth/register', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 400 se mancano campi obbligatori', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'mario@test.com' })

        expect(res.status).toBe(400)
    })

    it('risponde 400 se email non è valida', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Mario', surname: 'Rossi', email: 'non-email', password: 'sicura123' })

        expect(res.status).toBe(400)
    })

    it('risponde 400 se password è troppo corta', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Mario', surname: 'Rossi', email: 'mario@test.com', password: '123' })

        expect(res.status).toBe(400)
    })

    it('risponde 400 se email è già registrata', async () => {
        User.findByEmail.mockResolvedValue({ id: 1, email: 'mario@test.com' })

        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Mario', surname: 'Rossi', email: 'mario@test.com', password: 'sicura123' })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/già stata registrata/)
    })

    it('risponde 201 con registrazione corretta', async () => {
        User.findByEmail.mockResolvedValue(null)
        User.create.mockResolvedValue(42)

        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Mario', surname: 'Rossi', email: 'mario@test.com', password: 'sicura123' })

        expect(res.status).toBe(201)
        expect(res.body.userId).toBe(42)
    })
})

describe('POST /api/auth/login', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 400 se mancano email o password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'mario@test.com' })

        expect(res.status).toBe(400)
    })

    it('risponde 401 se utente non esiste', async () => {
        User.findByEmail.mockResolvedValue(null)

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'mario@test.com', password: 'sicura123' })

        expect(res.status).toBe(401)
    })

    it('risponde 401 se password è errata', async () => {
        // bcrypt.compare darà false perché la password hashata non corrisponde
        User.findByEmail.mockResolvedValue({
            id: 1, email: 'mario@test.com',
            password: '$2b$10$hashinvalido', role: 'user'
        })

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'mario@test.com', password: 'passwordsbagliata' })

        expect(res.status).toBe(401)
    })

    it('risponde 200 con accessToken e refreshToken se credenziali corrette', async () => {
        const bcrypt = await import('bcrypt')
        const hashedPw = await bcrypt.hash('sicura123', 10)

        User.findByEmail.mockResolvedValue({
            id: 1, name: 'Mario', surname: 'Rossi',
            email: 'mario@test.com', password: hashedPw, role: 'user'
        })
        RefreshToken.save.mockResolvedValue()

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'mario@test.com', password: 'sicura123' })

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('accessToken')
        expect(res.body).toHaveProperty('refreshToken')
        expect(res.body.user.email).toBe('mario@test.com')
    })
})

describe('POST /api/auth/logout', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 200 anche senza refreshToken nel body', async () => {
        RefreshToken.delete.mockResolvedValue()

        const res = await request(app)
            .post('/api/auth/logout')
            .send({})

        expect(res.status).toBe(200)
    })

    it('elimina il refresh token dal DB', async () => {
        RefreshToken.delete.mockResolvedValue()

        await request(app)
            .post('/api/auth/logout')
            .send({ refreshToken: 'un-token-qualsiasi' })

        expect(RefreshToken.delete).toHaveBeenCalledWith('un-token-qualsiasi')
    })
})

describe('POST /api/auth/refresh', () => {
    beforeEach(() => vi.clearAllMocks())

    it('risponde 401 se refreshToken è assente', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({})

        expect(res.status).toBe(401)
    })

    it('risponde 401 se refreshToken non è nel DB', async () => {
        RefreshToken.findValid.mockResolvedValue(null)

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: 'tokenfalso' })

        expect(res.status).toBe(401)
    })
})
