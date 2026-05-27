import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'

// Set env before importing module
process.env['JWT_SECRET'] = 'test_secret_key_for_unit_tests'

const { signToken, verifyToken } = await import('../lib/jwt.js')

describe('JWT — signToken / verifyToken', () => {
  let token: string

  before(async () => {
    token = await signToken({ sub: 'test@example.com', rol: 'usuario_general' })
  })

  test('signToken retorna string no vacío', () => {
    assert.ok(token.length > 0)
    assert.ok(token.includes('.'))
  })

  test('verifyToken decodifica payload correctamente', async () => {
    const payload = await verifyToken(token)
    assert.equal(payload.sub, 'test@example.com')
    assert.equal(payload.rol, 'usuario_general')
  })

  test('verifyToken falla con token inválido', async () => {
    await assert.rejects(() => verifyToken('token.invalido.abc'))
  })

  test('verifyToken falla con token manipulado', async () => {
    const partes = token.split('.')
    const tokenManipulado = `${partes[0]}.${partes[1]}xyz.${partes[2]}`
    await assert.rejects(() => verifyToken(tokenManipulado))
  })

  test('payload incluye iat y exp', async () => {
    const payload = await verifyToken(token)
    assert.ok(typeof payload.iat === 'number')
    assert.ok(typeof payload.exp === 'number')
    assert.ok(payload.exp > payload.iat)
  })

  test('signToken funciona con todos los roles', async () => {
    for (const rol of ['admin_por_pais_sede', 'funcionario_de_validacion', 'usuario_general'] as const) {
      const t = await signToken({ sub: 'x@x.com', rol })
      const p = await verifyToken(t)
      assert.equal(p.rol, rol)
    }
  })
})
