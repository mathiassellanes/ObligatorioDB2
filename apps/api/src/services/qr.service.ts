import { sql } from '../db/client.js'
import { randomBytes } from 'node:crypto'

const QR_EXPIRY_SECONDS = 30

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function generarCodigo(): string {
  const bytes = randomBytes(8)
  return Array.from(bytes, b => CHARSET[b % CHARSET.length]).join('')
}

export async function generarQR(id_entrada: number, email: string) {
  // Verificar propietario
  const [entrada] = await sql`
    SELECT * FROM entrada WHERE id = ${id_entrada} AND email_propietario_actual = ${email}
  `
  if (!entrada) throw new Error('No sos el propietario de esta entrada')
  if (entrada.consumida) throw new Error('La entrada ya fue consumida')

  // Invalidar QR previos no usados de esta entrada
  await sql`
    DELETE FROM qr
    WHERE id_entrada = ${id_entrada} AND fecha_de_uso IS NULL
  `

  const codigo = generarCodigo()
  const [qr] = await sql`
    INSERT INTO qr (codigo_rotativo, id_entrada)
    VALUES (${codigo}, ${id_entrada})
    RETURNING *
  `

  return {
    ...qr,
    expira_en: QR_EXPIRY_SECONDS,
  }
}

export async function validarQR(codigo_rotativo: string, id_dispositivo: string, email_funcionario: string, id_sector_seleccionado: number, id_evento_seleccionado: number) {
  // Verificar dispositivo existe
  const [dispositivo] = await sql`SELECT id FROM dispositivo WHERE id = ${id_dispositivo}`
  if (!dispositivo) throw new Error('Dispositivo no autorizado')

  // Obtener el legajo del funcionario logueado
  const [funcionario] = await sql`
    SELECT numero_legajo FROM funcionario_de_validacion WHERE email = ${email_funcionario}
  `
  if (!funcionario) throw new Error('Funcionario no encontrado')

  // Buscar el QR (en cualquier estado) para poder distinguir entre expirado,
  // ya usado, y re-validación idempotente.
  const [qr] = await sql`
    SELECT q.*, e.id_evento, e.id_sector, e.consumida,
      (q.fecha_creacion > NOW() - INTERVAL '30 seconds') AS vigente
    FROM qr q
    JOIN entrada e ON e.id = q.id_entrada
    WHERE q.codigo_rotativo = ${codigo_rotativo}
  `
  if (!qr) throw new Error('QR inválido o expirado')

  // Verificar que el QR corresponde al evento y sector seleccionado por el funcionario
  if (qr.id_evento !== id_evento_seleccionado || qr.id_sector !== id_sector_seleccionado) {
    const [info] = await sql`
      SELECT el.nombre AS local, evis.nombre AS visitante
      FROM evento ev
      JOIN equipo el   ON el.id  = ev.id_equipo_local
      JOIN equipo evis ON evis.id = ev.id_equipo_visitante
      WHERE ev.id = ${qr.id_evento}
    `
    const partido = info ? `${info.local} vs ${info.visitante}` : `partido #${qr.id_evento}`
    throw new Error(`Esta entrada es para ${partido} — no corresponde al sector/evento seleccionado`)
  }

  // Idempotencia: el mismo dispositivo re-enviando el mismo QR (doble submit,
  // reintento de red, doble-invoke de React) ve éxito en vez de un falso error.
  if (qr.fecha_de_uso && qr.id_dispositivo_validacion === id_dispositivo) {
    return { ok: true, id_entrada: qr.id_entrada }
  }
  // Usado por otro dispositivo, o la entrada ya fue consumida por otra vía.
  if (qr.fecha_de_uso || qr.consumida) throw new Error('La entrada ya fue consumida')
  if (!qr.vigente) throw new Error('QR inválido o expirado')

  // Verificar que el dispositivo esté vinculado a este evento Y asignado al funcionario logueado
  const [autorizado] = await sql`
    SELECT 1 FROM dispositivo_evento
    WHERE id_dispositivo = ${id_dispositivo}
      AND id_evento = ${qr.id_evento}
      AND numero_legajo = ${funcionario.numero_legajo}
  `
  if (!autorizado) throw new Error('Dispositivo no autorizado para este evento')

  // Verificar que el funcionario esté asignado al sector/evento
  const asignado = await sql`
    SELECT 1 FROM asignado_a
    WHERE numero_legajo = ${funcionario.numero_legajo}
      AND id_sector = ${qr.id_sector}
      AND id_evento = ${qr.id_evento}
  `
  if (asignado.length === 0) {
    const [info] = await sql`
      SELECT el.nombre AS local, evis.nombre AS visitante
      FROM evento ev
      JOIN equipo el   ON el.id  = ev.id_equipo_local
      JOIN equipo evis ON evis.id = ev.id_equipo_visitante
      WHERE ev.id = ${qr.id_evento}
    `
    const partido = info ? `${info.local} vs ${info.visitante}` : `partido #${qr.id_evento}`
    throw new Error(`Esta entrada es para ${partido} — no estás asignado a ese partido`)
  }

  // Marcar QR como usado y entrada como consumida
  await sql.begin(async (tx) => {
    await tx`
      UPDATE qr
      SET fecha_de_uso = NOW(), id_dispositivo_validacion = ${id_dispositivo}
      WHERE codigo_rotativo = ${codigo_rotativo}
    `
    await tx`
      UPDATE entrada SET consumida = TRUE WHERE id = ${qr.id_entrada}
    `
    // Marcar validacion_completa si no quedan entradas pendientes en este sector/evento
    await tx`
      UPDATE asignado_a
      SET validacion_completa = TRUE
      WHERE numero_legajo = ${funcionario.numero_legajo}
        AND id_sector = ${qr.id_sector}
        AND id_evento = ${qr.id_evento}
        AND NOT EXISTS (
          SELECT 1 FROM entrada en
          WHERE en.id_sector = ${qr.id_sector}
            AND en.id_evento = ${qr.id_evento}
            AND en.consumida = FALSE
        )
    `
  })

  // Datos para notificar al dueño en tiempo real (a qué sector ir).
  const [info] = await sql`
    SELECT e.email_propietario_actual AS email,
      s.nombre  AS nombre_sector,
      est.nombre AS nombre_estadio,
      el.nombre  AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante
    FROM entrada e
    JOIN sector s   ON s.id = e.id_sector
    JOIN estadio est ON est.id = s.id_estadio
    JOIN evento ev  ON ev.id = e.id_evento
    JOIN equipo el  ON el.id = ev.id_equipo_local
    JOIN equipo evis ON evis.id = ev.id_equipo_visitante
    WHERE e.id = ${qr.id_entrada}
  `

  return {
    ok: true,
    id_entrada: qr.id_entrada,
    email_propietario: info?.email as string,
    nombre_sector: info?.nombre_sector as string,
    nombre_estadio: info?.nombre_estadio as string,
    nombre_equipo_local: info?.nombre_equipo_local as string,
    nombre_equipo_visitante: info?.nombre_equipo_visitante as string,
  }
}

export async function sectoresAsignados(numero_legajo: string, id_evento: number) {
  return sql`
    SELECT aa.*, s.nombre AS nombre_sector, s.capacidad_maxima,
      (SELECT COUNT(*) FROM entrada en WHERE en.id_sector = aa.id_sector AND en.id_evento = aa.id_evento AND en.consumida = TRUE) AS validadas
    FROM asignado_a aa
    JOIN sector s ON s.id = aa.id_sector
    WHERE aa.numero_legajo = ${numero_legajo} AND aa.id_evento = ${id_evento}
  `
}
