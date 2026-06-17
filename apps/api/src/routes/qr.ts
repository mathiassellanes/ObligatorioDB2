import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ValidarQRDTO } from '@repo/shared'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as qrService from '../services/qr.service.js'
import * as dispositivoService from '../services/dispositivo.service.js'
import { notificarValidacion } from '../lib/realtime.js'

const qr = new Hono()

// Usuario solicita QR para su entrada
qr.get(
  '/:id_entrada',
  authMiddleware,
  roleGuard('usuario_general'),
  zValidator('param', z.object({ id_entrada: z.coerce.number() })),
  async (c) => {
    const { id_entrada } = c.req.valid('param')
    const user = c.get('user')
    try {
      const result = await qrService.generarQR(id_entrada, user.sub)
      return c.json(result)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

// Dispositivo valida QR
qr.post(
  '/validar',
  authMiddleware,
  roleGuard('funcionario_de_validacion'),
  zValidator('json', ValidarQRDTO),
  async (c) => {
    const body = c.req.valid('json')
    try {
      const result = await qrService.validarQR(body.codigo_rotativo, body.id_dispositivo)
      // Avisar al dueño en tiempo real a qué sector dirigirse.
      if (result.email_propietario) {
        notificarValidacion(result.email_propietario, {
          type: 'entrada_validada',
          id_entrada: result.id_entrada,
          nombre_sector: result.nombre_sector,
          nombre_estadio: result.nombre_estadio,
          nombre_equipo_local: result.nombre_equipo_local,
          nombre_equipo_visitante: result.nombre_equipo_visitante,
        })
      }
      return c.json(result)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

// Funcionario ve sus sectores asignados para un evento
qr.get(
  '/sectores/:id_evento',
  authMiddleware,
  roleGuard('funcionario_de_validacion'),
  zValidator('param', z.object({ id_evento: z.coerce.number() })),
  async (c) => {
    const { id_evento } = c.req.valid('param')
    const user = c.get('user')

    const [funcionario] = await import('../db/client.js').then(({ sql }) =>
      sql`SELECT numero_legajo FROM funcionario_de_validacion WHERE email = ${user.sub}`
    )
    if (!funcionario) return c.json({ error: 'Funcionario no encontrado' }, 404)

    const rows = await qrService.sectoresAsignados(funcionario.numero_legajo as string, id_evento)
    return c.json(rows)
  }
)

// Funcionario: obtener sectores asignados con dispositivo por evento
qr.get('/funcionario/me', authMiddleware, roleGuard('funcionario_de_validacion'), async (c) => {
  const user = c.get('user')
  const sectores = await dispositivoService.sectoresAsignadosFuncionario(user.sub)
  return c.json({ sectores })
})

export default qr
