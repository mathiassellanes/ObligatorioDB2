import { sql } from '../db/client.js'
import type { ComprarEntradasDTO } from '@repo/shared'

export async function comprar(email_usuario: string, data: ComprarEntradasDTO) {
  if (data.entradas.length > 5) {
    throw new Error('Máximo 5 entradas por transacción')
  }

  // Obtener comisión activa (la más reciente)
  const [comision] = await sql`
    SELECT * FROM comision ORDER BY id DESC LIMIT 1
  `
  if (!comision) throw new Error('No hay comisión configurada')

  // Obtener costos de cada sector_evento
  const sectores = await sql`
    SELECT se.id_sector, se.id_evento, se.costo_entrada, s.capacidad_maxima,
      (SELECT COUNT(*) FROM entrada en WHERE en.id_sector = se.id_sector AND en.id_evento = se.id_evento) AS vendidas
    FROM sector_evento se
    JOIN sector s ON s.id = se.id_sector
    WHERE se.id_evento = ${data.id_evento}
      AND se.id_sector = ANY(${data.entradas.map((e) => e.id_sector)})
  `

  const sectorMap = new Map(sectores.map((s) => [s.id_sector as number, s]))

  // Verificar disponibilidad
  for (const e of data.entradas) {
    const s = sectorMap.get(e.id_sector)
    if (!s) throw new Error(`Sector ${e.id_sector} no habilitado para este evento`)
    if (Number(s.vendidas) >= Number(s.capacidad_maxima)) {
      throw new Error(`Sector ${e.id_sector} sin capacidad disponible`)
    }
  }

  const subtotal = data.entradas.reduce((acc, e) => {
    const s = sectorMap.get(e.id_sector)!
    return acc + Number(s.costo_entrada)
  }, 0)

  const monto_total = subtotal * (1 + Number(comision.monto))

  return sql.begin(async (tx) => {
    const [venta] = await tx`
      INSERT INTO venta (estado, monto_total, email_usuario, id_comision)
      VALUES ('paga', ${monto_total}, ${email_usuario}, ${comision.id})
      RETURNING *
    `

    const entradas = []
    for (const e of data.entradas) {
      const [entrada] = await tx`
        INSERT INTO entrada (email_propietario_actual, id_venta, id_sector, id_evento)
        VALUES (${email_usuario}, ${venta!.id}, ${e.id_sector}, ${data.id_evento})
        RETURNING *
      `
      entradas.push(entrada)
    }

    return { venta, entradas }
  })
}

export async function misVentas(email: string) {
  return sql`
    SELECT v.*, c.monto AS comision_monto,
      (SELECT COUNT(*) FROM entrada e WHERE e.id_venta = v.id) AS cantidad_entradas
    FROM venta v
    JOIN comision c ON c.id = v.id_comision
    WHERE v.email_usuario = ${email}
    ORDER BY v.fecha DESC
  `
}

export async function misEntradas(email: string) {
  return sql`
    SELECT en.*, ev.fecha AS fecha_evento, ev.hora AS hora_evento,
      est.nombre AS nombre_estadio,
      el.nombre  AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante,
      s.nombre   AS nombre_sector,
      se.costo_entrada
    FROM entrada en
    JOIN evento ev    ON ev.id  = en.id_evento
    JOIN estadio est  ON est.id = ev.id_estadio
    JOIN equipo el    ON el.id  = ev.id_equipo_local
    JOIN equipo evis  ON evis.id = ev.id_equipo_visitante
    JOIN sector s     ON s.id   = en.id_sector
    JOIN sector_evento se ON se.id_sector = en.id_sector AND se.id_evento = en.id_evento
    WHERE en.email_propietario_actual = ${email}
    ORDER BY ev.fecha, ev.hora
  `
}

export async function getEntrada(id: number, email: string) {
  const [row] = await sql`
    SELECT en.*, ev.fecha AS fecha_evento, ev.hora AS hora_evento,
      est.nombre AS nombre_estadio,
      el.nombre  AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante,
      s.nombre   AS nombre_sector,
      se.costo_entrada
    FROM entrada en
    JOIN evento ev    ON ev.id  = en.id_evento
    JOIN estadio est  ON est.id = ev.id_estadio
    JOIN equipo el    ON el.id  = ev.id_equipo_local
    JOIN equipo evis  ON evis.id = ev.id_equipo_visitante
    JOIN sector s     ON s.id   = en.id_sector
    JOIN sector_evento se ON se.id_sector = en.id_sector AND se.id_evento = en.id_evento
    WHERE en.id = ${id} AND en.email_propietario_actual = ${email}
  `
  if (!row) throw new Error('Entrada no encontrada')
  return row
}
