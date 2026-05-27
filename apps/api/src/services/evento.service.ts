import { sql } from '../db/client.js'
import type { CreateEventoDTO, HabilitarSectoresDTO } from '@repo/shared'

export async function listarEventos() {
  return sql`
    SELECT
      e.*,
      est.nombre AS nombre_estadio,
      el.nombre  AS nombre_equipo_local,
      ev.nombre  AS nombre_equipo_visitante
    FROM evento e
    JOIN estadio est ON est.id = e.id_estadio
    JOIN equipo el   ON el.id  = e.id_equipo_local
    JOIN equipo ev   ON ev.id  = e.id_equipo_visitante
    ORDER BY e.fecha, e.hora
  `
}

export async function getEvento(id: number) {
  const [row] = await sql`
    SELECT
      e.*,
      est.nombre AS nombre_estadio,
      el.nombre  AS nombre_equipo_local,
      ev.nombre  AS nombre_equipo_visitante
    FROM evento e
    JOIN estadio est ON est.id = e.id_estadio
    JOIN equipo el   ON el.id  = e.id_equipo_local
    JOIN equipo ev   ON ev.id  = e.id_equipo_visitante
    WHERE e.id = ${id}
  `
  if (!row) throw new Error('Evento no encontrado')

  const sectores = await sql`
    SELECT s.*, se.costo_entrada,
      (SELECT COUNT(*) FROM entrada en WHERE en.id_sector = s.id AND en.id_evento = ${id}) AS entradas_vendidas
    FROM sector_evento se
    JOIN sector s ON s.id = se.id_sector
    WHERE se.id_evento = ${id}
    ORDER BY s.nombre
  `

  return { ...row, sectores }
}

export async function crearEvento(data: CreateEventoDTO, email_admin: string) {
  // Verificar que el admin gestiona el estadio
  const gestiona = await sql`
    SELECT 1 FROM gestiona
    WHERE email_admin = ${email_admin} AND id_estadio = ${data.id_estadio}
  `
  if (gestiona.length === 0) {
    throw new Error('No tenés permisos para crear eventos en ese estadio')
  }

  // La superposición se valida via trigger en la DB
  const [row] = await sql`
    INSERT INTO evento (fecha, hora, id_estadio, id_equipo_local, id_equipo_visitante)
    VALUES (${data.fecha}, ${data.hora}, ${data.id_estadio}, ${data.id_equipo_local}, ${data.id_equipo_visitante})
    RETURNING *
  `
  return row
}

export async function habilitarSectores(id_evento: number, data: HabilitarSectoresDTO, email_admin: string) {
  const evento = await sql`
    SELECT e.id_estadio FROM evento e WHERE e.id = ${id_evento}
  `
  if (evento.length === 0) throw new Error('Evento no encontrado')

  const gestiona = await sql`
    SELECT 1 FROM gestiona
    WHERE email_admin = ${email_admin} AND id_estadio = ${evento[0]!.id_estadio}
  `
  if (gestiona.length === 0) throw new Error('Sin permisos para este evento')

  const inserted = []
  for (const s of data.sectores) {
    const [row] = await sql`
      INSERT INTO sector_evento (id_sector, id_evento, costo_entrada)
      VALUES (${s.id_sector}, ${id_evento}, ${s.costo_entrada})
      ON CONFLICT (id_sector, id_evento) DO UPDATE SET costo_entrada = EXCLUDED.costo_entrada
      RETURNING *
    `
    inserted.push(row)
  }
  return inserted
}

export async function asignarFuncionario(
  id_evento: number,
  id_sector: number,
  numero_legajo: string,
  fecha: string
) {
  const [row] = await sql`
    INSERT INTO asignado_a (numero_legajo, id_sector, id_evento, fecha)
    VALUES (${numero_legajo}, ${id_sector}, ${id_evento}, ${fecha})
    ON CONFLICT DO NOTHING
    RETURNING *
  `
  return row
}
