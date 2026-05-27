import { sql } from '../db/client.js'
import type { CreateEquipoDTO } from '@repo/shared'

export async function listarEquipos() {
  return sql`SELECT * FROM equipo ORDER BY nombre`
}

export async function crearEquipo(data: CreateEquipoDTO) {
  const [row] = await sql`
    INSERT INTO equipo (nombre) VALUES (${data.nombre}) RETURNING *
  `
  return row
}

export async function getEquipo(id: number) {
  const [row] = await sql`SELECT * FROM equipo WHERE id = ${id}`
  if (!row) throw new Error('Equipo no encontrado')
  return row
}

export async function eventosDeEquipo(id: number) {
  return sql`
    SELECT e.*, est.nombre AS nombre_estadio,
           el.nombre AS nombre_equipo_local, ev.nombre AS nombre_equipo_visitante
    FROM evento e
    JOIN estadio est ON est.id = e.id_estadio
    JOIN equipo el   ON el.id  = e.id_equipo_local
    JOIN equipo ev   ON ev.id  = e.id_equipo_visitante
    WHERE e.id_equipo_local = ${id} OR e.id_equipo_visitante = ${id}
    ORDER BY e.fecha DESC, e.hora
  `
}
