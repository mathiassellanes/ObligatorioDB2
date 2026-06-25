import { sql } from '../db/client.js'

export async function listarDispositivos() {
  return sql`
    SELECT d.id, d.nombre, d.numero_legajo, c.email,
      COUNT(de.id_evento)::int AS total_eventos
    FROM dispositivo d
    JOIN funcionario_de_validacion fv ON fv.numero_legajo = d.numero_legajo
    JOIN credenciales c ON c.email = fv.email
    LEFT JOIN dispositivo_evento de ON de.id_dispositivo = d.id
    GROUP BY d.id, d.nombre, d.numero_legajo, c.email
    ORDER BY c.email
  `
}

export async function getDispositivo(id: string) {
  const [row] = await sql`
    SELECT d.id, d.nombre, d.numero_legajo, c.email
    FROM dispositivo d
    JOIN funcionario_de_validacion fv ON fv.numero_legajo = d.numero_legajo
    JOIN credenciales c ON c.email = fv.email
    WHERE d.id = ${id}
  `
  if (!row) throw new Error('Dispositivo no encontrado')
  return row
}

export async function getDispositivoEventos(id: string) {
  return sql`
    SELECT
      de.id_evento,
      de.numero_legajo,
      c.email AS email_funcionario,
      ev.fecha AS fecha_evento,
      ev.hora  AS hora_evento,
      est.nombre AS nombre_estadio,
      el.nombre  AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante,
      el.bandera  AS bandera_equipo_local,
      evis.bandera AS bandera_equipo_visitante
    FROM dispositivo_evento de
    JOIN evento ev   ON ev.id  = de.id_evento
    JOIN estadio est ON est.id = ev.id_estadio
    JOIN equipo el   ON el.id  = ev.id_equipo_local
    JOIN equipo evis ON evis.id = ev.id_equipo_visitante
    JOIN funcionario_de_validacion fv ON fv.numero_legajo = de.numero_legajo
    JOIN credenciales c ON c.email = fv.email
    WHERE de.id_dispositivo = ${id}
    ORDER BY ev.fecha DESC, ev.hora DESC
  `
}

export async function crearDispositivo(numero_legajo: string, nombre: string) {
  const [func] = await sql`
    SELECT numero_legajo FROM funcionario_de_validacion WHERE numero_legajo = ${numero_legajo}
  `
  if (!func) throw new Error('Funcionario no encontrado')

  const [row] = await sql`
    INSERT INTO dispositivo (numero_legajo, nombre) VALUES (${numero_legajo}, ${nombre}) RETURNING *
  `
  return row
}

export async function actualizarDispositivo(id: string, data: { nombre?: string; numero_legajo?: string }) {
  const [row] = await sql`
    UPDATE dispositivo
    SET nombre = COALESCE(${data.nombre ?? null}, nombre),
        numero_legajo = COALESCE(${data.numero_legajo ?? null}, numero_legajo)
    WHERE id = ${id}
    RETURNING *
  `
  if (!row) throw new Error('Dispositivo no encontrado')
  return row
}

export async function vincularEvento(id_dispositivo: string, id_evento: number, numero_legajo: string) {
  const [disp] = await sql`SELECT id, numero_legajo FROM dispositivo WHERE id = ${id_dispositivo}`
  if (!disp) throw new Error('Dispositivo no encontrado')

  const [ev] = await sql`SELECT id FROM evento WHERE id = ${id_evento}`
  if (!ev) throw new Error('Evento no encontrado')

  const [row] = await sql`
    INSERT INTO dispositivo_evento (id_dispositivo, id_evento, numero_legajo)
    VALUES (${id_dispositivo}, ${id_evento}, ${numero_legajo})
    ON CONFLICT DO NOTHING
    RETURNING *
  `
  return row ?? { id_dispositivo, id_evento, numero_legajo }
}

export async function desvincularEvento(id_dispositivo: string, id_evento: number) {
  await sql`
    DELETE FROM dispositivo_evento
    WHERE id_dispositivo = ${id_dispositivo} AND id_evento = ${id_evento}
  `
  return { ok: true }
}

export async function eliminarDispositivo(id: string) {
  const [row] = await sql`DELETE FROM dispositivo WHERE id = ${id} RETURNING id`
  if (!row) throw new Error('Dispositivo no encontrado')
  return { ok: true }
}

export async function sectoresAsignadosFuncionario(email: string) {
  return sql`
    SELECT aa.id_sector, aa.id_evento, aa.validacion_completa,
      s.nombre AS nombre_sector,
      ev.fecha AS fecha_evento,
      ev.hora  AS hora_evento,
      el.nombre AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante,
      d.id AS dispositivo_id
    FROM asignado_a aa
    JOIN funcionario_de_validacion fv ON fv.numero_legajo = aa.numero_legajo
    JOIN sector s ON s.id = aa.id_sector
    JOIN evento ev ON ev.id = aa.id_evento
    JOIN equipo el ON el.id = ev.id_equipo_local
    JOIN equipo evis ON evis.id = ev.id_equipo_visitante
    LEFT JOIN dispositivo d ON d.numero_legajo = aa.numero_legajo
    LEFT JOIN dispositivo_evento de ON de.id_dispositivo = d.id AND de.id_evento = aa.id_evento
    WHERE fv.email = ${email}
      AND ev.fecha >= CURRENT_DATE - INTERVAL '1 day'
      AND ev.fecha <= CURRENT_DATE + INTERVAL '2 days'
    ORDER BY ev.fecha DESC, ev.hora DESC
  `
}
