import { sql } from '../db/client.js'
import { hashPassword, verifyPassword } from '../lib/hash.js'
import { signToken } from '../lib/jwt.js'
import type { CreatePerfilDTO } from '@repo/shared'

export async function register(data: CreatePerfilDTO) {
  const { password, telefonos, ...perfil } = data

  const existing = await sql`SELECT email FROM perfil WHERE email = ${perfil.email}`
  if (existing.length > 0) {
    throw new Error('El email ya está registrado')
  }

  const docExisting = await sql`
    SELECT email FROM perfil
    WHERE documento_pais = ${perfil.documento_pais}
      AND documento_tipo = ${perfil.documento_tipo}
      AND documento_numero = ${perfil.documento_numero}
  `
  if (docExisting.length > 0) {
    throw new Error('El documento ya está registrado')
  }

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO perfil (
        email, documento_pais, documento_tipo, documento_numero,
        dir_pais, dir_localidad, dir_calle, dir_numero, dir_codigo_postal
      ) VALUES (
        ${perfil.email}, ${perfil.documento_pais}, ${perfil.documento_tipo},
        ${perfil.documento_numero}, ${perfil.dir_pais}, ${perfil.dir_localidad},
        ${perfil.dir_calle}, ${perfil.dir_numero}, ${perfil.dir_codigo_postal}
      )
    `

    await tx`
      INSERT INTO credenciales (email, password_hash)
      VALUES (${perfil.email}, ${hashPassword(password)})
    `

    await tx`
      INSERT INTO usuario_general (email)
      VALUES (${perfil.email})
    `

    for (const tel of telefonos) {
      await tx`
        INSERT INTO telefono (email, telefono) VALUES (${perfil.email}, ${tel})
      `
    }
  })

  return { email: perfil.email }
}

export async function login(email: string, password: string) {
  const rows = await sql`
    SELECT c.password_hash,
           CASE
             WHEN a.email IS NOT NULL THEN 'admin_por_pais_sede'
             WHEN f.email IS NOT NULL THEN 'funcionario_de_validacion'
             ELSE 'usuario_general'
           END AS rol
    FROM credenciales c
    LEFT JOIN admin_por_pais_sede a ON a.email = c.email
    LEFT JOIN funcionario_de_validacion f ON f.email = c.email
    WHERE c.email = ${email}
  `

  if (rows.length === 0) {
    throw new Error('Credenciales inválidas')
  }

  const row = rows[0]!
  if (!verifyPassword(password, row.password_hash as string)) {
    throw new Error('Credenciales inválidas')
  }

  const token = await signToken({
    sub: email,
    rol: row.rol as 'admin_por_pais_sede' | 'funcionario_de_validacion' | 'usuario_general',
  })

  return { token, rol: row.rol }
}

export async function getMe(email: string) {
  const [perfil] = await sql`
    SELECT p.*, u.fecha_registro, u.estado_verificacion_identidad
    FROM perfil p
    LEFT JOIN usuario_general u ON u.email = p.email
    WHERE p.email = ${email}
  `
  if (!perfil) throw new Error('Perfil no encontrado')

  const telefonos = await sql`
    SELECT telefono FROM telefono WHERE email = ${email}
  `

  return { ...perfil, telefonos: telefonos.map((t) => t.telefono) }
}

export async function updatePerfil(email: string, data: {
  dir_pais: string; dir_localidad: string; dir_calle: string
  dir_numero: string; dir_codigo_postal: string
}) {
  const [row] = await sql`
    UPDATE perfil SET
      dir_pais = ${data.dir_pais},
      dir_localidad = ${data.dir_localidad},
      dir_calle = ${data.dir_calle},
      dir_numero = ${data.dir_numero},
      dir_codigo_postal = ${data.dir_codigo_postal}
    WHERE email = ${email}
    RETURNING *
  `
  if (!row) throw new Error('Perfil no encontrado')
  return row
}
