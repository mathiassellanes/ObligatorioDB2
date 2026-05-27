import { sql } from '../db/client.js'

export async function eventosMasVendidos(limit = 10) {
  return sql`
    SELECT
      ev.id,
      ev.fecha,
      ev.hora,
      est.nombre AS nombre_estadio,
      el.nombre  AS nombre_equipo_local,
      evis.nombre AS nombre_equipo_visitante,
      COUNT(en.id)::int AS total_entradas
    FROM evento ev
    JOIN estadio est  ON est.id  = ev.id_estadio
    JOIN equipo el    ON el.id   = ev.id_equipo_local
    JOIN equipo evis  ON evis.id = ev.id_equipo_visitante
    LEFT JOIN entrada en ON en.id_evento = ev.id
    GROUP BY ev.id, est.nombre, el.nombre, evis.nombre
    ORDER BY total_entradas DESC
    LIMIT ${limit}
  `
}

export async function rankingCompradores(limit = 10) {
  return sql`
    SELECT
      p.email,
      COUNT(DISTINCT v.id)::int AS total_ventas,
      COUNT(en.id)::int         AS total_entradas,
      SUM(v.monto_total)        AS monto_gastado
    FROM perfil p
    JOIN usuario_general ug ON ug.email = p.email
    LEFT JOIN venta v        ON v.email_usuario = p.email
    LEFT JOIN entrada en     ON en.id_venta = v.id
    GROUP BY p.email
    ORDER BY total_entradas DESC
    LIMIT ${limit}
  `
}
