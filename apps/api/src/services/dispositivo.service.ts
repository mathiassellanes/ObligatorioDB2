import { sql } from '../db/client.js'

export async function listarDispositivos() {
  return sql`
    SELECT d.id, d.numero_legajo, p.email
    FROM dispositivo d
    JOIN funcionario_de_validacion f ON f.numero_legajo = d.numero_legajo
    JOIN credenciales cr ON cr.email = f.email
    ORDER BY d.numero_legajo
  `
}

export async function crearDispositivo(numero_legajo: string) {
  const [func] = await sql`
    SELECT numero_legajo FROM funcionario_de_validacion WHERE numero_legajo = ${numero_legajo}
  `
  if (!func) throw new Error('Funcionario no encontrado')

  const [row] = await sql`
    INSERT INTO dispositivo (numero_legajo) VALUES (${numero_legajo}) RETURNING *
  `
  return row
}

export async function eliminarDispositivo(id: string) {
  const [row] = await sql`DELETE FROM dispositivo WHERE id = ${id} RETURNING id`
  if (!row) throw new Error('Dispositivo no encontrado')
  return { ok: true }
}

export async function dispositivosDeFuncionario(email: string) {
  return sql`
    SELECT d.id
    FROM dispositivo d
    JOIN funcionario_de_validacion f ON f.numero_legajo = d.numero_legajo
    WHERE f.email = ${email}
    LIMIT 1
  `
}

export async function sectoresAsignadosFuncionario(email: string) {
  return sql`
    SELECT aa.id_sector, aa.id_evento, aa.validacion_completa,
      s.nombre AS nombre_sector,
      ev.fecha AS fecha_evento,
      el.nombre AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante
    FROM asignado_a aa
    JOIN funcionario_de_validacion f ON f.numero_legajo = aa.numero_legajo
    JOIN sector s ON s.id = aa.id_sector
    JOIN evento ev ON ev.id = aa.id_evento
    JOIN equipo el ON el.id = ev.id_equipo_local
    JOIN equipo evis ON evis.id = ev.id_equipo_visitante
    WHERE f.email = ${email}
    ORDER BY ev.fecha DESC
  `
}
