import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../lib/hash.js'

describe('hashPassword / verifyPassword', () => {
  test('hash no es igual al password original', () => {
    const hash = hashPassword('secreto123')
    assert.notEqual(hash, 'secreto123')
  })

  test('verifyPassword retorna true con password correcto', () => {
    const hash = hashPassword('miPassword!')
    assert.equal(verifyPassword('miPassword!', hash), true)
  })

  test('verifyPassword retorna false con password incorrecto', () => {
    const hash = hashPassword('miPassword!')
    assert.equal(verifyPassword('otraCosa', hash), false)
  })

  test('dos hashes del mismo password son distintos (salt)', () => {
    const h1 = hashPassword('mismo')
    const h2 = hashPassword('mismo')
    assert.notEqual(h1, h2)
  })

  test('verifyPassword retorna false con hash malformado', () => {
    assert.equal(verifyPassword('algo', 'hashsinseparador'), false)
  })
})
