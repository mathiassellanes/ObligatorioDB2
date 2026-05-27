import { sql } from '../db/client.js'
import type { CreateEstadioDTO, CreateSectorDTO } from '@repo/shared'

export async function listarEstadios() {
  return sql`SELECT * FROM estadio ORDER BY nombre`
}

export async function getEstadio(id: number) {
  const [row] = await sql`SELECT * FROM estadio WHERE id = ${id}`
  if (!row) throw new Error('Estadio no encontrado')
  return row
}

export async function crearEstadio(data: CreateEstadioDTO) {
  const [row] = await sql`
    INSERT INTO estadio (nombre) VALUES (${data.nombre}) RETURNING *
  `
  return row
}

export async function listarSectores(id_estadio: number) {
  return sql`SELECT * FROM sector WHERE id_estadio = ${id_estadio} ORDER BY nombre`
}

export async function crearSector(data: CreateSectorDTO) {
  const estadio = await sql`SELECT id FROM estadio WHERE id = ${data.id_estadio}`
  if (estadio.length === 0) throw new Error('Estadio no encontrado')

  const [row] = await sql`
    INSERT INTO sector (nombre, capacidad_maxima, id_estadio)
    VALUES (${data.nombre}, ${data.capacidad_maxima}, ${data.id_estadio})
    RETURNING *
  `
  return row
}

export async function estadiosDeAdmin(email: string) {
  return sql`
    SELECT e.* FROM estadio e
    JOIN gestiona g ON g.id_estadio = e.id
    WHERE g.email_admin = ${email}
    ORDER BY e.nombre
  `
}

export async function asignarEstadioAdmin(email_admin: string, id_estadio: number) {
  const [row] = await sql`
    INSERT INTO gestiona (email_admin, id_estadio)
    VALUES (${email_admin}, ${id_estadio})
    ON CONFLICT DO NOTHING
    RETURNING *
  `
  return row
}

export async function getEstadioConSectores(id: number) {
  const [row] = await sql`SELECT * FROM estadio WHERE id = ${id}`
  if (!row) throw new Error('Estadio no encontrado')
  const sectores = await sql`SELECT * FROM sector WHERE id_estadio = ${id} ORDER BY nombre`
  return { ...row, sectores }
}

export async function eventosEnEstadio(id_estadio: number) {
  return sql`
    SELECT e.*, el.nombre AS nombre_equipo_local, ev.nombre AS nombre_equipo_visitante
    FROM evento e
    JOIN equipo el ON el.id = e.id_equipo_local
    JOIN equipo ev ON ev.id = e.id_equipo_visitante
    WHERE e.id_estadio = ${id_estadio}
    ORDER BY e.fecha DESC, e.hora
  `
}
