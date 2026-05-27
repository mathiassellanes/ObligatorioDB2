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
