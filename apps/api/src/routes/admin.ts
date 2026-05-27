import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as estadioService from '../services/estadio.service.js'
import * as authService from '../services/auth.service.js'

const admin = new Hono()

admin.get('/estadios', authMiddleware, roleGuard('admin_por_pais_sede'), async (c) => {
  const user = c.get('user')
  const rows = await estadioService.estadiosDeAdmin(user.sub)
  return c.json(rows)
})

admin.post(
  '/estadios/:id_estadio/asignar',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id_estadio: z.coerce.number() })),
  async (c) => {
    const user = c.get('user')
    const { id_estadio } = c.req.valid('param')
    const row = await estadioService.asignarEstadioAdmin(user.sub, id_estadio)
    return c.json(row, 201)
  }
)

export default admin

admin.get('/funcionarios', authMiddleware, roleGuard('admin_por_pais_sede'), async (c) => {
  const rows = await authService.listarFuncionarios()
  return c.json(rows)
})

admin.post(
  '/funcionarios',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('json', z.object({
    email: z.string().email(),
    password: z.string().min(6),
    numero_legajo: z.string().min(1).max(50),
    documento_pais: z.string().min(1).max(100),
    documento_tipo: z.string().min(1).max(50),
    documento_numero: z.string().min(1).max(50),
    dir_pais: z.string().min(1).max(100),
    dir_localidad: z.string().min(1).max(100),
    dir_calle: z.string().min(1).max(200),
    dir_numero: z.string().min(1).max(20),
    dir_codigo_postal: z.string().min(1).max(20),
  })),
  async (c) => {
    const body = c.req.valid('json')
    try {
      const result = await authService.crearFuncionario(body)
      return c.json(result, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 409)
    }
  }
)
