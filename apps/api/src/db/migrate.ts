import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from './client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, 'migrations')

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename  TEXT        PRIMARY KEY,
      ran_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const already = await sql`
      SELECT 1 FROM _migrations WHERE filename = ${file}
    `
    if (already.length > 0) {
      console.log(`skip: ${file}`)
      continue
    }

    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf-8')
    await sql.begin(async (tx) => {
      await tx.unsafe(content)
      await tx`INSERT INTO _migrations (filename) VALUES (${file})`
    })
    console.log(`ran:  ${file}`)
  }

  await sql.end()
  console.log('migrations done')
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
