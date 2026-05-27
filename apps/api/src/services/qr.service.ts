import { sql } from '../db/client.js'
import { randomUUID } from 'node:crypto'

const QR_EXPIRY_SECONDS = 30

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

  const codigo = randomUUID()
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

export async function validarQR(codigo_rotativo: string, id_dispositivo: string) {
  // Verificar dispositivo autorizado
  const [dispositivo] = await sql`
    SELECT d.*, f.numero_legajo
    FROM dispositivo d
    JOIN funcionario_de_validacion f ON f.numero_legajo = d.numero_legajo
    WHERE d.id = ${id_dispositivo}
  `
  if (!dispositivo) throw new Error('Dispositivo no autorizado')

  // Buscar QR activo
  const [qr] = await sql`
    SELECT q.*, e.id_evento, e.id_sector, e.consumida
    FROM qr q
    JOIN entrada e ON e.id = q.id_entrada
    WHERE q.codigo_rotativo = ${codigo_rotativo}
      AND q.fecha_de_uso IS NULL
      AND q.fecha_creacion > NOW() - INTERVAL '30 seconds'
  `
  if (!qr) throw new Error('QR inválido o expirado')
  if (qr.consumida) throw new Error('La entrada ya fue consumida')

  // Verificar que el funcionario esté asignado al sector/evento
  const asignado = await sql`
    SELECT 1 FROM asignado_a
    WHERE numero_legajo = ${dispositivo.numero_legajo}
      AND id_sector = ${qr.id_sector}
      AND id_evento = ${qr.id_evento}
  `
  if (asignado.length === 0) {
    throw new Error('El funcionario no está asignado a este sector')
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
    // Verificar si el funcionario completó todos sus sectores en el evento
    const pendientes = await tx`
      SELECT COUNT(*)::int AS count
      FROM asignado_a aa
      WHERE aa.numero_legajo = ${dispositivo.numero_legajo}
        AND aa.id_evento = ${qr.id_evento}
        AND aa.validacion_completa = FALSE
    ` as [{ count: number }][]

    // Si ya no quedan sectores sin validar (simplificación: marcamos si al menos hay una entrada validada)
    await tx`
      UPDATE asignado_a
      SET validacion_completa = TRUE
      WHERE numero_legajo = ${dispositivo.numero_legajo}
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

  return { ok: true, id_entrada: qr.id_entrada }
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
