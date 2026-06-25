import { sql } from '../db/client.js'
import type { CreateEventoDTO, HabilitarSectoresDTO } from '@repo/shared'

export async function listarEventos() {
  return sql`
    SELECT
      e.*,
      est.nombre AS nombre_estadio,
      el.nombre  AS nombre_equipo_local,
      ev.nombre  AS nombre_equipo_visitante,
      el.bandera AS bandera_equipo_local,
      ev.bandera AS bandera_equipo_visitante
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
      ev.nombre  AS nombre_equipo_visitante,
      el.bandera AS bandera_equipo_local,
      ev.bandera AS bandera_equipo_visitante
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

  // Normalizar fecha a string YYYY-MM-DD para evitar conversión UTC por postgres.js
  const fechaStr = new Date(data.fecha).toISOString().slice(0, 10)

  // La superposición se valida via trigger en la DB
  const [row] = await sql`
    INSERT INTO evento (fecha, hora, id_estadio, id_equipo_local, id_equipo_visitante)
    VALUES (${fechaStr}, ${data.hora}, ${data.id_estadio}, ${data.id_equipo_local}, ${data.id_equipo_visitante})
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

export async function deshabilitarSector(id_evento: number, id_sector: number, email_admin: string) {
  const [evento] = await sql`SELECT id_estadio FROM evento WHERE id = ${id_evento}`
  if (!evento) throw new Error('Evento no encontrado')

  const gestiona = await sql`
    SELECT 1 FROM gestiona WHERE email_admin = ${email_admin} AND id_estadio = ${evento.id_estadio}
  `
  if (gestiona.length === 0) throw new Error('Sin permisos para este evento')

  const [vendidas] = await sql`
    SELECT COUNT(*)::int AS count FROM entrada
    WHERE id_evento = ${id_evento} AND id_sector = ${id_sector}
  `
  if ((vendidas?.count ?? 0) > 0) throw new Error('No se puede deshabilitar un sector con entradas vendidas')

  await sql`DELETE FROM sector_evento WHERE id_evento = ${id_evento} AND id_sector = ${id_sector}`
  return { ok: true }
}

export async function asignarFuncionario(
  id_evento: number,
  id_sector: number,
  numero_legajo: string
) {
  const func = await sql`
    SELECT numero_legajo FROM funcionario_de_validacion WHERE numero_legajo = ${numero_legajo}
  `
  if (func.length === 0) throw new Error(`Funcionario con legajo "${numero_legajo}" no existe en el sistema`)

  await sql`
    INSERT INTO asignado_a (numero_legajo, id_sector, id_evento)
    VALUES (${numero_legajo}, ${id_sector}, ${id_evento})
    ON CONFLICT DO NOTHING
  `
  return { ok: true }
}

export async function desasignarFuncionario(id_evento: number, id_sector: number, numero_legajo: string) {
  await sql`
    DELETE FROM asignado_a
    WHERE numero_legajo = ${numero_legajo} AND id_sector = ${id_sector} AND id_evento = ${id_evento}
  `
  return { ok: true }
}

export async function getAsignaciones(id_evento: number) {
  return sql`
    SELECT
      a.numero_legajo,
      a.id_sector,
      f.email AS email_funcionario,
      s.nombre AS nombre_sector,
      COUNT(e.id) FILTER (WHERE e.id IS NOT NULL)     AS total_entradas,
      COUNT(e.id) FILTER (WHERE e.consumida = true)   AS entradas_validadas,
      a.validacion_completa
    FROM asignado_a a
    JOIN funcionario_de_validacion f ON f.numero_legajo = a.numero_legajo
    JOIN sector s ON s.id = a.id_sector
    LEFT JOIN entrada e ON e.id_sector = a.id_sector AND e.id_evento = a.id_evento
    WHERE a.id_evento = ${id_evento}
    GROUP BY a.numero_legajo, a.id_sector, f.email, s.nombre, a.validacion_completa
    ORDER BY s.nombre, a.numero_legajo
  `
}
