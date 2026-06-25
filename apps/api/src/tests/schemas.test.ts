import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  PerfilSchema,
  CreatePerfilDTO,
  LoginDTO,
  ComprarEntradasDTO,
  CrearTransferenciaDTO,
  ValidarQRDTO,
  CreateEventoDTO,
  EventoSchema,
} from '@repo/shared'

describe('Zod schemas — validaciones de negocio', () => {
  describe('PerfilSchema', () => {
    const perfil = {
      email: 'juan@test.com',
      documento_pais: 'Uruguay',
      documento_tipo: 'CI',
      documento_numero: '12345678',
      dir_pais: 'Uruguay',
      dir_localidad: 'Montevideo',
      dir_calle: '18 de Julio',
      dir_numero: '1234',
      dir_codigo_postal: '11200',
    }

    test('acepta perfil válido', () => {
      const result = PerfilSchema.safeParse(perfil)
      assert.equal(result.success, true)
    })

    test('rechaza email inválido', () => {
      const result = PerfilSchema.safeParse({ ...perfil, email: 'noemail' })
      assert.equal(result.success, false)
    })
  })

  describe('CreatePerfilDTO', () => {
    const base = {
      email: 'juan@test.com',
      password: 'password123',
      telefonos: ['+598 99 111 222'],
      documento_pais: 'Uruguay', documento_tipo: 'CI', documento_numero: '1234567',
      dir_pais: 'Uruguay', dir_localidad: 'Mvd', dir_calle: 'Calle', dir_numero: '1', dir_codigo_postal: '11000',
    }

    test('acepta DTO válido', () => {
      assert.equal(CreatePerfilDTO.safeParse(base).success, true)
    })

    test('rechaza password menor a 8 caracteres', () => {
      assert.equal(CreatePerfilDTO.safeParse({ ...base, password: 'corto' }).success, false)
    })

    test('rechaza teléfonos vacíos', () => {
      assert.equal(CreatePerfilDTO.safeParse({ ...base, telefonos: [] }).success, false)
    })
  })

  describe('ComprarEntradasDTO — máximo 5 entradas', () => {
    test('acepta 1 entrada', () => {
      const r = ComprarEntradasDTO.safeParse({ id_evento: 1, entradas: [{ id_sector: 1 }] })
      assert.equal(r.success, true)
    })

    test('acepta 5 entradas', () => {
      const entradas = Array(5).fill({ id_sector: 1 })
      const r = ComprarEntradasDTO.safeParse({ id_evento: 1, entradas })
      assert.equal(r.success, true)
    })

    test('rechaza 6 entradas', () => {
      const entradas = Array(6).fill({ id_sector: 1 })
      const r = ComprarEntradasDTO.safeParse({ id_evento: 1, entradas })
      assert.equal(r.success, false)
    })

    test('rechaza 0 entradas', () => {
      const r = ComprarEntradasDTO.safeParse({ id_evento: 1, entradas: [] })
      assert.equal(r.success, false)
    })
  })

  describe('CreateEventoDTO — equipos distintos', () => {
    const base = {
      fecha: new Date('2026-06-15'),
      hora: '18:00',
      id_estadio: 1,
      id_equipo_local: 1,
      id_equipo_visitante: 2,
    }

    test('acepta evento válido', () => {
      assert.equal(CreateEventoDTO.safeParse(base).success, true)
    })

    test('rechaza equipos iguales', () => {
      const r = CreateEventoDTO.safeParse({ ...base, id_equipo_visitante: 1 })
      assert.equal(r.success, false)
    })
  })

  describe('ValidarQRDTO', () => {
    test('acepta código corto válido', () => {
      const r = ValidarQRDTO.safeParse({
        codigo_rotativo: 'ABCD3456',
        id_dispositivo: '550e8400-e29b-41d4-a716-446655440001',
        id_sector: 1,
        id_evento: 1,
      })
      assert.equal(r.success, true)
    })

    test('acepta UUID legacy', () => {
      const r = ValidarQRDTO.safeParse({
        codigo_rotativo: '550e8400-e29b-41d4-a716-446655440000',
        id_dispositivo: '550e8400-e29b-41d4-a716-446655440001',
        id_sector: 1,
        id_evento: 1,
      })
      assert.equal(r.success, true)
    })

    test('rechaza código vacío', () => {
      const r = ValidarQRDTO.safeParse({ codigo_rotativo: 'abc', id_dispositivo: '550e8400-e29b-41d4-a716-446655440001' })
      assert.equal(r.success, false)
    })

    test('rechaza id_dispositivo no-UUID', () => {
      const r = ValidarQRDTO.safeParse({ codigo_rotativo: 'ABCD3456', id_dispositivo: 'notauuid' })
      assert.equal(r.success, false)
    })
  })

  describe('LoginDTO', () => {
    test('acepta email y password', () => {
      assert.equal(LoginDTO.safeParse({ email: 'a@b.com', password: 'x' }).success, true)
    })

    test('rechaza email malformado', () => {
      assert.equal(LoginDTO.safeParse({ email: 'noemail', password: 'x' }).success, false)
    })

    test('rechaza password vacío', () => {
      assert.equal(LoginDTO.safeParse({ email: 'a@b.com', password: '' }).success, false)
    })
  })

  describe('CrearTransferenciaDTO', () => {
    test('acepta datos válidos', () => {
      const r = CrearTransferenciaDTO.safeParse({ email_destino: 'dest@test.com', id_entrada: 1 })
      assert.equal(r.success, true)
    })

    test('rechaza email destino inválido', () => {
      const r = CrearTransferenciaDTO.safeParse({ email_destino: 'noemail', id_entrada: 1 })
      assert.equal(r.success, false)
    })
  })
})
