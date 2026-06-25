import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as estadioService from '../services/estadio.service.js'
import * as authService from '../services/auth.service.js'
import * as dispositivoService from '../services/dispositivo.service.js'

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

admin.get('/dispositivos', authMiddleware, roleGuard('admin_por_pais_sede'), async (c) => {
  const rows = await dispositivoService.listarDispositivos()
  return c.json(rows)
})

admin.post(
  '/dispositivos',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('json', z.object({ numero_legajo: z.string().min(1), nombre: z.string().min(1).max(100) })),
  async (c) => {
    const { numero_legajo, nombre } = c.req.valid('json')
    try {
      const row = await dispositivoService.crearDispositivo(numero_legajo, nombre)
      return c.json(row, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

admin.get(
  '/dispositivos/:id',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const { id } = c.req.valid('param')
    try {
      const [disp, eventos] = await Promise.all([
        dispositivoService.getDispositivo(id),
        dispositivoService.getDispositivoEventos(id),
      ])
      return c.json({ ...disp, eventos })
    } catch (err) {
      return c.json({ error: (err as Error).message }, 404)
    }
  }
)

admin.put(
  '/dispositivos/:id',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', z.object({
    nombre: z.string().min(1).max(100).optional(),
    numero_legajo: z.string().min(1).optional(),
  })),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    try {
      const row = await dispositivoService.actualizarDispositivo(id, body)
      return c.json(row)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 404)
    }
  }
)

admin.post(
  '/dispositivos/:id/eventos',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', z.object({
    id_evento: z.number().int().positive(),
    numero_legajo: z.string().min(1),
  })),
  async (c) => {
    const { id } = c.req.valid('param')
    const { id_evento, numero_legajo } = c.req.valid('json')
    try {
      const row = await dispositivoService.vincularEvento(id, id_evento, numero_legajo)
      return c.json(row, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

admin.delete(
  '/dispositivos/:id/eventos/:id_evento',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.string().uuid(), id_evento: z.coerce.number() })),
  async (c) => {
    const { id, id_evento } = c.req.valid('param')
    await dispositivoService.desvincularEvento(id, id_evento)
    return c.json({ ok: true })
  }
)

admin.delete(
  '/dispositivos/:id',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const { id } = c.req.valid('param')
    try {
      const result = await dispositivoService.eliminarDispositivo(id)
      return c.json(result)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 404)
    }
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
