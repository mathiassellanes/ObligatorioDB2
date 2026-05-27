import { sql } from '../db/client.js'
import type { CrearTransferenciaDTO } from '@repo/shared'

export async function crear(email_origen: string, data: CrearTransferenciaDTO) {
  // Verificar propietario
  const [entrada] = await sql`
    SELECT * FROM entrada WHERE id = ${data.id_entrada} AND email_propietario_actual = ${email_origen}
  `
  if (!entrada) throw new Error('No sos el propietario de esta entrada')
  if (entrada.consumida) throw new Error('La entrada ya fue consumida')

  // Verificar destino existe
  const [destino] = await sql`
    SELECT email FROM usuario_general WHERE email = ${data.email_destino}
  `
  if (!destino) throw new Error('El usuario destino no existe')

  // Verificar max 3 transferencias (también en trigger, pero validamos antes)
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM transferencia
    WHERE id_entrada = ${data.id_entrada} AND estado = 'aceptada'
  ` as [{ count: number }]
  if (count >= 3) throw new Error('La entrada ya alcanzó el máximo de 3 transferencias')

  // Verificar no hay transferencia pendiente activa
  const pendiente = await sql`
    SELECT id FROM transferencia
    WHERE id_entrada = ${data.id_entrada} AND estado = 'pendiente'
  `
  if (pendiente.length > 0) throw new Error('Ya existe una transferencia pendiente para esta entrada')

  const [row] = await sql`
    INSERT INTO transferencia (email_origen, email_destino, id_entrada)
    VALUES (${email_origen}, ${data.email_destino}, ${data.id_entrada})
    RETURNING *
  `
  return row
}

export async function responder(id: number, email_destino: string, accion: 'aceptar' | 'rechazar') {
  const [transf] = await sql`
    SELECT * FROM transferencia WHERE id = ${id} AND estado = 'pendiente'
  `
  if (!transf) throw new Error('Transferencia no encontrada o ya procesada')
  if (transf.email_destino !== email_destino) throw new Error('Sin permisos para esta transferencia')

  if (accion === 'aceptar') {
    await sql.begin(async (tx) => {
      await tx`
        UPDATE transferencia SET estado = 'aceptada' WHERE id = ${id}
      `
      await tx`
        UPDATE entrada SET email_propietario_actual = ${email_destino}
        WHERE id = ${transf.id_entrada}
      `
    })
  } else {
    await sql`UPDATE transferencia SET estado = 'rechazada' WHERE id = ${id}`
  }

  return { ok: true, accion }
}

export async function cancelar(id: number, email_origen: string) {
  const [transf] = await sql`
    SELECT * FROM transferencia WHERE id = ${id} AND estado = 'pendiente'
  `
  if (!transf) throw new Error('Transferencia no encontrada o ya procesada')
  if (transf.email_origen !== email_origen) throw new Error('Sin permisos para cancelar esta transferencia')

  await sql`UPDATE transferencia SET estado = 'cancelada' WHERE id = ${id}`
  return { ok: true }
}

export async function historial(email: string) {
  return sql`
    SELECT t.*,
      e.id_evento, e.id_sector,
      ev.fecha AS fecha_evento,
      el.nombre AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante
    FROM transferencia t
    JOIN entrada e   ON e.id  = t.id_entrada
    JOIN evento ev   ON ev.id = e.id_evento
    JOIN equipo el   ON el.id = ev.id_equipo_local
    JOIN equipo evis ON evis.id = ev.id_equipo_visitante
    WHERE t.email_origen = ${email} OR t.email_destino = ${email}
    ORDER BY t.fecha DESC
  `
}

export async function pendientesRecibidas(email: string) {
  return sql`
    SELECT t.*,
      ev.fecha AS fecha_evento,
      el.nombre AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante,
      s.nombre AS nombre_sector
    FROM transferencia t
    JOIN entrada en  ON en.id  = t.id_entrada
    JOIN evento ev   ON ev.id  = en.id_evento
    JOIN equipo el   ON el.id  = ev.id_equipo_local
    JOIN equipo evis ON evis.id = ev.id_equipo_visitante
    JOIN sector s    ON s.id   = en.id_sector
    WHERE t.email_destino = ${email} AND t.estado = 'pendiente'
    ORDER BY t.fecha DESC
  `
}
