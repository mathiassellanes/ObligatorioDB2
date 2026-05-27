import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreatePerfilDTO, LoginDTO } from '@repo/shared'
import * as authService from '../services/auth.service.js'
import { authMiddleware } from '../middleware/auth.js'

const auth = new Hono()

auth.post('/register', zValidator('json', CreatePerfilDTO), async (c) => {
  const body = c.req.valid('json')
  try {
    const result = await authService.register(body)
    return c.json(result, 201)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 409)
  }
})

auth.post('/login', zValidator('json', LoginDTO), async (c) => {
  const { email, password } = c.req.valid('json')
  try {
    const result = await authService.login(email, password)
    return c.json(result)
  } catch {
    return c.json({ error: 'Credenciales inválidas' }, 401)
  }
})

auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    const perfil = await authService.getMe(user.sub)
    return c.json(perfil)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 404)
  }
})

export default auth
