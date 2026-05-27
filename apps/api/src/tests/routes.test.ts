import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ComprarEntradasDTO, LoginDTO } from '@repo/shared'

process.env['JWT_SECRET'] = 'test_secret_key_for_unit_tests'

// Import at module top-level (top-level await is fine in ESM modules)
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import { signToken } from '../lib/jwt.js'

describe('Route validation — zValidator integration', () => {
  describe('POST /auth/login validation', () => {
    const app = new Hono()
    app.post('/login', zValidator('json', LoginDTO), (c) => {
      const body = c.req.valid('json')
      return c.json({ ok: true, email: body.email })
    })

    test('retorna 200 con payload válido', async () => {
      const req = new Request('http://localhost/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@b.com', password: 'pass123' }),
      })
      const res = await app.fetch(req)
      assert.equal(res.status, 200)
      const data = await res.json() as { ok: boolean }
      assert.equal(data.ok, true)
    })

    test('retorna 400 con email inválido', async () => {
      const req = new Request('http://localhost/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'noemail', password: 'x' }),
      })
      const res = await app.fetch(req)
      assert.equal(res.status, 400)
    })

    test('retorna 400 con body vacío', async () => {
      const req = new Request('http://localhost/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const res = await app.fetch(req)
      assert.equal(res.status, 400)
    })
  })

  describe('POST /ventas — max 5 entradas', () => {
    const app = new Hono()
    app.post('/ventas', zValidator('json', ComprarEntradasDTO), (c) => {
      const body = c.req.valid('json')
      return c.json({ ok: true, cantidad: body.entradas.length })
    })

    test('acepta 5 entradas', async () => {
      const req = new Request('http://localhost/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_evento: 1, entradas: Array(5).fill({ id_sector: 1 }) }),
      })
      const res = await app.fetch(req)
      assert.equal(res.status, 200)
    })

    test('rechaza 6 entradas', async () => {
      const req = new Request('http://localhost/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_evento: 1, entradas: Array(6).fill({ id_sector: 1 }) }),
      })
      const res = await app.fetch(req)
      assert.equal(res.status, 400)
    })
  })

  describe('authMiddleware', () => {
    const app = new Hono()
    app.get('/protected', authMiddleware, (c) => {
      const user = c.get('user')
      return c.json({ email: user.sub })
    })

    test('retorna 401 sin Authorization header', async () => {
      const res = await app.fetch(new Request('http://localhost/protected'))
      assert.equal(res.status, 401)
    })

    test('retorna 401 con token inválido', async () => {
      const res = await app.fetch(new Request('http://localhost/protected', {
        headers: { Authorization: 'Bearer token.falso.123' },
      }))
      assert.equal(res.status, 401)
    })

    test('retorna 200 con token válido', async () => {
      const token = await signToken({ sub: 'test@test.com', rol: 'usuario_general' })
      const res = await app.fetch(new Request('http://localhost/protected', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
      const data = await res.json() as { email: string }
      assert.equal(data.email, 'test@test.com')
    })
  })

  describe('roleGuard', () => {
    const app = new Hono()
    app.get('/admin-only', authMiddleware, roleGuard('admin_por_pais_sede'), (c) => c.json({ ok: true }))

    test('retorna 403 con rol incorrecto', async () => {
      const token = await signToken({ sub: 'u@u.com', rol: 'usuario_general' })
      const res = await app.fetch(new Request('http://localhost/admin-only', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 403)
    })

    test('retorna 200 con rol correcto', async () => {
      const token = await signToken({ sub: 'a@a.com', rol: 'admin_por_pais_sede' })
      const res = await app.fetch(new Request('http://localhost/admin-only', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })
})
