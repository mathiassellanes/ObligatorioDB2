import { sql } from './client.js'
import { hashPassword } from '../lib/hash.js'

async function main() {
  const email = 'admin@mundial2026.com'
  const password = 'admin123'
  const hash = hashPassword(password)

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO perfil (email, documento_pais, documento_tipo, documento_numero,
        dir_pais, dir_localidad, dir_calle, dir_numero, dir_codigo_postal)
      VALUES (${email}, 'Uruguay', 'CI', '00000001', 'Uruguay', 'Montevideo', 'Admin St', '1', '11000')
      ON CONFLICT DO NOTHING
    `
    await tx`INSERT INTO credenciales (email, password_hash) VALUES (${email}, ${hash}) ON CONFLICT DO NOTHING`
    await tx`DELETE FROM usuario_general WHERE email = ${email}`
    await tx`INSERT INTO admin_por_pais_sede (email) VALUES (${email}) ON CONFLICT DO NOTHING`
    await tx`INSERT INTO gestiona (email_admin, id_estadio) SELECT ${email}, id FROM estadio ON CONFLICT DO NOTHING`
  })

  console.log(`✓ ${email} / ${password}`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
