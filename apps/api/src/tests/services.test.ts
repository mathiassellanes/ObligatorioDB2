/**
 * Comprehensive service + route tests.
 * Mocks db/client.js so no real DB connection is needed.
 */

process.env['JWT_SECRET'] = 'test_secret_key_for_unit_tests'

import { test, describe, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { signToken } from '../lib/jwt.js'
import { hashPassword } from '../lib/hash.js'

// ---------------------------------------------------------------------------
// Queue-based DB mock
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>
const queue: Row[][] = []

const mockSql: any = async (..._args: any[]) => queue.shift() ?? []
mockSql.begin = async (cb: (tx: any) => Promise<unknown>) => cb(mockSql)
mockSql.end = async () => {}

mock.module('../db/client.js', { namedExports: { sql: mockSql } })

// ---------------------------------------------------------------------------
// Dynamic imports (AFTER mock registration)
// ---------------------------------------------------------------------------
const authSvc   = await import('../services/auth.service.js')
const ventaSvc  = await import('../services/venta.service.js')
const qrSvc     = await import('../services/qr.service.js')
const transfSvc = await import('../services/transferencia.service.js')
const equipoSvc = await import('../services/equipo.service.js')
const estadioSvc = await import('../services/estadio.service.js')
const eventoSvc = await import('../services/evento.service.js')
const reportesSvc = await import('../services/reportes.service.js')
const dispositivoSvc = await import('../services/dispositivo.service.js')

const { default: authRoute }   = await import('../routes/auth.js')
const { default: ventasRoute } = await import('../routes/ventas.js')
const { default: entradasRoute } = await import('../routes/entradas.js')
const { default: transfRoute } = await import('../routes/transferencias.js')
const { default: equiposRoute } = await import('../routes/equipos.js')
const { default: estadiosRoute } = await import('../routes/estadios.js')
const { default: eventosRoute } = await import('../routes/eventos.js')
const { default: qrRoute }     = await import('../routes/qr.js')
const { default: reportesRoute } = await import('../routes/reportes.js')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function push(...rows: Row[][]) { queue.push(...rows) }
function reset() { queue.length = 0 }

function makeApp() {
  const app = new Hono()
  app.route('/auth', authRoute)
  app.route('/ventas', ventasRoute)
  app.route('/entradas', entradasRoute)
  app.route('/transferencias', transfRoute)
  app.route('/equipos', equiposRoute)
  app.route('/estadios', estadiosRoute)
  app.route('/eventos', eventosRoute)
  app.route('/qr', qrRoute)
  app.route('/reportes', reportesRoute)
  return app
}

async function userToken() {
  return signToken({ sub: 'user@test.com', rol: 'usuario_general' })
}
async function adminToken() {
  return signToken({ sub: 'admin@test.com', rol: 'admin_por_pais_sede' })
}
async function funcToken() {
  return signToken({ sub: 'func@test.com', rol: 'funcionario_de_validacion' })
}

const BASE_PERFIL = {
  email: 'u@test.com',
  password: 'pass12345',
  telefonos: ['099000001'],
  documento_pais: 'Uruguay',
  documento_tipo: 'CI',
  documento_numero: '11111111',
  dir_pais: 'Uruguay',
  dir_localidad: 'Montevideo',
  dir_calle: 'Calle Test',
  dir_numero: '1',
  dir_codigo_postal: '11000',
}

// ===========================================================================
// auth.service
// ===========================================================================
describe('auth.service', () => {
  beforeEach(reset)

  test('register — email ya existe lanza error', async () => {
    push([{ email: 'u@test.com' }])
    await assert.rejects(() => authSvc.register(BASE_PERFIL), /email ya está registrado/)
  })

  test('register — documento ya existe lanza error', async () => {
    push([], [{ email: 'otro@test.com' }])
    await assert.rejects(() => authSvc.register(BASE_PERFIL), /documento ya está registrado/)
  })

  test('register — éxito', async () => {
    push([], [], [])  // email check, doc check; begin: INSERT perfil, creds, ug, tel (all []  default)
    const r = await authSvc.register(BASE_PERFIL)
    assert.equal(r.email, 'u@test.com')
  })

  test('login — credenciales no encontradas lanza error', async () => {
    push([])
    await assert.rejects(() => authSvc.login('x@x.com', 'pass'), /Credenciales inválidas/)
  })

  test('login — password incorrecto lanza error', async () => {
    push([{ password_hash: hashPassword('other'), rol: 'usuario_general' }])
    await assert.rejects(() => authSvc.login('x@x.com', 'wrong'), /Credenciales inválidas/)
  })

  test('login — éxito retorna token y rol', async () => {
    push([{ password_hash: hashPassword('secret123'), rol: 'usuario_general' }])
    const r = await authSvc.login('u@test.com', 'secret123')
    assert.ok(r.token)
    assert.equal(r.rol, 'usuario_general')
  })

  test('getMe — perfil encontrado', async () => {
    push([{ email: 'u@test.com', dir_pais: 'Uruguay' }], [{ telefono: '099' }])
    const r = await authSvc.getMe('u@test.com') as any
    assert.equal(r.email, 'u@test.com')
    assert.deepEqual(r.telefonos, ['099'])
  })

  test('getMe — no encontrado lanza error', async () => {
    push([], [])
    await assert.rejects(() => authSvc.getMe('x@x.com'), /Perfil no encontrado/)
  })

  test('updatePerfil — éxito', async () => {
    push([{ email: 'u@test.com', dir_pais: 'UY' }])
    const r = await authSvc.updatePerfil('u@test.com', {
      dir_pais: 'UY', dir_localidad: 'Mvd', dir_calle: 'C', dir_numero: '1', dir_codigo_postal: '11000',
    }) as any
    assert.equal(r.email, 'u@test.com')
  })

  test('updatePerfil — no encontrado lanza error', async () => {
    push([])
    await assert.rejects(
      () => authSvc.updatePerfil('x@x.com', { dir_pais: 'UY', dir_localidad: 'Mvd', dir_calle: 'C', dir_numero: '1', dir_codigo_postal: '11000' }),
      /Perfil no encontrado/,
    )
  })

  test('crearFuncionario — email existe lanza error', async () => {
    push([{ email: 'f@f.com' }])
    await assert.rejects(
      () => authSvc.crearFuncionario({ email: 'f@f.com', password: 'pass1234', numero_legajo: 'L1', ...BASE_PERFIL }),
      /email ya está registrado/,
    )
  })

  test('crearFuncionario — legajo existe lanza error', async () => {
    push([], [{ numero_legajo: 'L1' }])
    await assert.rejects(
      () => authSvc.crearFuncionario({ email: 'f@f.com', password: 'pass1234', numero_legajo: 'L1', ...BASE_PERFIL }),
      /legajo ya está en uso/,
    )
  })

  test('crearFuncionario — éxito', async () => {
    push([], [])
    const r = await authSvc.crearFuncionario({ ...BASE_PERFIL, email: 'f@f.com', password: 'pass1234', numero_legajo: 'L1' }) as any
    assert.equal(r.email, 'f@f.com')
  })
})

// ===========================================================================
// venta.service
// ===========================================================================
describe('venta.service', () => {
  beforeEach(reset)

  const COMPRAR_BASE = { id_evento: 1, entradas: [{ id_sector: 1 }] }

  test('comprar — más de 5 entradas lanza error', async () => {
    await assert.rejects(
      () => ventaSvc.comprar('u@test.com', { id_evento: 1, entradas: Array(6).fill({ id_sector: 1 }) }),
      /Máximo 5/,
    )
  })

  test('comprar — sin comisión lanza error', async () => {
    push([])
    await assert.rejects(() => ventaSvc.comprar('u@test.com', COMPRAR_BASE), /comisión configurada/)
  })

  test('comprar — sector no habilitado lanza error', async () => {
    push([{ id: 1, monto: '0.05' }], [])
    await assert.rejects(() => ventaSvc.comprar('u@test.com', COMPRAR_BASE), /no habilitado/)
  })

  test('comprar — sector sin capacidad lanza error', async () => {
    push(
      [{ id: 1, monto: '0.05' }],
      [{ id_sector: 1, costo_entrada: '100', capacidad_maxima: 5, vendidas: '5' }],
    )
    await assert.rejects(() => ventaSvc.comprar('u@test.com', COMPRAR_BASE), /sin capacidad/)
  })

  test('comprar — éxito retorna venta y entradas', async () => {
    push(
      [{ id: 1, monto: '0.05' }],
      [{ id_sector: 1, costo_entrada: '100', capacidad_maxima: 10, vendidas: '3' }],
    )
    // begin → INSERT venta, INSERT entrada
    push(
      [{ id: 1, estado: 'paga', monto_total: '105', email_usuario: 'u@test.com', id_comision: 1 }],
      [{ id: 1, id_entrada: 1 }],
    )
    const r = await ventaSvc.comprar('u@test.com', COMPRAR_BASE) as any
    assert.ok(r.venta)
    assert.equal(r.entradas.length, 1)
  })

  test('misVentas — retorna lista', async () => {
    push([{ id: 1 }, { id: 2 }])
    const r = await ventaSvc.misVentas('u@test.com')
    assert.equal(r.length, 2)
  })

  test('misEntradas — retorna lista', async () => {
    push([{ id: 1 }])
    const r = await ventaSvc.misEntradas('u@test.com')
    assert.equal(r.length, 1)
  })

  test('getEntrada — encontrada', async () => {
    push([{ id: 5 }])
    const r = await ventaSvc.getEntrada(5, 'u@test.com') as any
    assert.equal(r.id, 5)
  })

  test('getEntrada — no encontrada lanza error', async () => {
    push([])
    await assert.rejects(() => ventaSvc.getEntrada(99, 'u@test.com'), /Entrada no encontrada/)
  })
})

// ===========================================================================
// qr.service
// ===========================================================================
describe('qr.service', () => {
  beforeEach(reset)

  test('generarQR — no propietario lanza error', async () => {
    push([])
    await assert.rejects(() => qrSvc.generarQR(1, 'otro@test.com'), /propietario/)
  })

  test('generarQR — entrada consumida lanza error', async () => {
    push([{ id: 1, consumida: true }])
    await assert.rejects(() => qrSvc.generarQR(1, 'u@test.com'), /consumida/)
  })

  test('generarQR — éxito retorna QR con expiración', async () => {
    push(
      [{ id: 1, consumida: false }],  // SELECT entrada
      [],                              // DELETE qrs previos
      [{ id: 1, codigo_rotativo: 'ABCD1234', fecha_creacion: new Date(), fecha_de_uso: null, id_entrada: 1, id_dispositivo_validacion: null }],
    )
    const r = await qrSvc.generarQR(1, 'u@test.com') as any
    assert.equal(r.expira_en, 30)
    assert.ok(r.codigo_rotativo)
  })

  test('sectoresAsignados — retorna lista', async () => {
    push([{ id_sector: 1 }, { id_sector: 2 }])
    const r = await qrSvc.sectoresAsignados('L1', 1)
    assert.equal(r.length, 2)
  })
})

// ===========================================================================
// transferencia.service
// ===========================================================================
describe('transferencia.service', () => {
  beforeEach(reset)

  test('crear — no propietario lanza error', async () => {
    push([])
    await assert.rejects(
      () => transfSvc.crear('u@test.com', { id_entrada: 1, email_destino: 'd@test.com' }),
      /propietario/,
    )
  })

  test('crear — entrada consumida lanza error', async () => {
    push([{ id: 1, consumida: true }])
    await assert.rejects(
      () => transfSvc.crear('u@test.com', { id_entrada: 1, email_destino: 'd@test.com' }),
      /consumida/,
    )
  })

  test('crear — destino no existe lanza error', async () => {
    push([{ id: 1, consumida: false }], [])
    await assert.rejects(
      () => transfSvc.crear('u@test.com', { id_entrada: 1, email_destino: 'd@test.com' }),
      /usuario destino no existe/,
    )
  })

  test('crear — máx 3 transferencias lanza error', async () => {
    push(
      [{ id: 1, consumida: false }],
      [{ email: 'd@test.com' }],
      [{ count: 3 }],
    )
    await assert.rejects(
      () => transfSvc.crear('u@test.com', { id_entrada: 1, email_destino: 'd@test.com' }),
      /máximo de 3/,
    )
  })

  test('crear — transferencia pendiente activa lanza error', async () => {
    push(
      [{ id: 1, consumida: false }],
      [{ email: 'd@test.com' }],
      [{ count: 1 }],
      [{ id: 99 }],
    )
    await assert.rejects(
      () => transfSvc.crear('u@test.com', { id_entrada: 1, email_destino: 'd@test.com' }),
      /pendiente/,
    )
  })

  test('crear — éxito', async () => {
    push(
      [{ id: 1, consumida: false }],
      [{ email: 'd@test.com' }],
      [{ count: 1 }],
      [],
      [{ id: 10, estado: 'pendiente' }],
    )
    const r = await transfSvc.crear('u@test.com', { id_entrada: 1, email_destino: 'd@test.com' }) as any
    assert.equal(r.id, 10)
  })

  test('responder — no encontrada lanza error', async () => {
    push([])
    await assert.rejects(() => transfSvc.responder(1, 'd@test.com', 'aceptar'), /no encontrada/)
  })

  test('responder — destino incorrecto lanza error', async () => {
    push([{ id: 1, email_destino: 'otro@test.com', estado: 'pendiente', id_entrada: 1 }])
    await assert.rejects(() => transfSvc.responder(1, 'd@test.com', 'aceptar'), /permisos/)
  })

  test('responder — aceptar transfiere propiedad', async () => {
    push(
      [{ id: 1, email_destino: 'd@test.com', estado: 'pendiente', id_entrada: 1 }],
    )
    // begin: UPDATE transferencia, UPDATE entrada
    push([], [])
    const r = await transfSvc.responder(1, 'd@test.com', 'aceptar') as any
    assert.equal(r.ok, true)
    assert.equal(r.accion, 'aceptar')
  })

  test('responder — rechazar', async () => {
    push(
      [{ id: 1, email_destino: 'd@test.com', estado: 'pendiente', id_entrada: 1 }],
      [],  // UPDATE rechazada
    )
    const r = await transfSvc.responder(1, 'd@test.com', 'rechazar') as any
    assert.equal(r.accion, 'rechazar')
  })

  test('cancelar — no encontrada lanza error', async () => {
    push([])
    await assert.rejects(() => transfSvc.cancelar(1, 'u@test.com'), /no encontrada/)
  })

  test('cancelar — no es el origen lanza error', async () => {
    push([{ id: 1, email_origen: 'otro@test.com', estado: 'pendiente' }])
    await assert.rejects(() => transfSvc.cancelar(1, 'u@test.com'), /permisos/)
  })

  test('cancelar — éxito', async () => {
    push([{ id: 1, email_origen: 'u@test.com', estado: 'pendiente' }], [])
    const r = await transfSvc.cancelar(1, 'u@test.com') as any
    assert.equal(r.ok, true)
  })

  test('historial — retorna lista', async () => {
    push([{ id: 1 }, { id: 2 }])
    const r = await transfSvc.historial('u@test.com')
    assert.equal(r.length, 2)
  })

  test('pendientesRecibidas — retorna lista', async () => {
    push([{ id: 1 }])
    const r = await transfSvc.pendientesRecibidas('u@test.com')
    assert.equal(r.length, 1)
  })
})

// ===========================================================================
// equipo.service
// ===========================================================================
describe('equipo.service', () => {
  beforeEach(reset)

  test('listarEquipos — retorna lista', async () => {
    push([{ id: 1, nombre: 'Uruguay' }, { id: 2, nombre: 'Brasil' }])
    const r = await equipoSvc.listarEquipos()
    assert.equal(r.length, 2)
  })

  test('getEquipo — encontrado', async () => {
    push([{ id: 1, nombre: 'Uruguay' }])
    const r = await equipoSvc.getEquipo(1) as any
    assert.equal(r.nombre, 'Uruguay')
  })

  test('getEquipo — no encontrado lanza error', async () => {
    push([])
    await assert.rejects(() => equipoSvc.getEquipo(999), /Equipo no encontrado/)
  })

  test('eventosDeEquipo — retorna lista', async () => {
    push([{ id: 1 }])
    const r = await equipoSvc.eventosDeEquipo(1)
    assert.equal(r.length, 1)
  })
})

// ===========================================================================
// estadio.service
// ===========================================================================
describe('estadio.service', () => {
  beforeEach(reset)

  test('listarEstadios — retorna lista', async () => {
    push([{ id: 1, nombre: 'MetLife' }])
    const r = await estadioSvc.listarEstadios()
    assert.equal(r.length, 1)
  })

  test('crearSector — estadio no encontrado lanza error', async () => {
    push([])
    await assert.rejects(
      () => estadioSvc.crearSector({ nombre: 'Norte', capacidad_maxima: 100, id_estadio: 99 }),
      /Estadio no encontrado/,
    )
  })

  test('crearSector — éxito', async () => {
    push([{ id: 99 }], [{ id: 1, nombre: 'Norte', capacidad_maxima: 100, id_estadio: 1 }])
    const r = await estadioSvc.crearSector({ nombre: 'Norte', capacidad_maxima: 100, id_estadio: 1 }) as any
    assert.equal(r.nombre, 'Norte')
  })

  test('estadiosDeAdmin — retorna lista', async () => {
    push([{ id: 1, nombre: 'MetLife' }])
    const r = await estadioSvc.estadiosDeAdmin('admin@test.com')
    assert.equal(r.length, 1)
  })

  test('getEstadioConSectores — no encontrado lanza error', async () => {
    push([])
    await assert.rejects(() => estadioSvc.getEstadioConSectores(999), /Estadio no encontrado/)
  })

  test('getEstadioConSectores — retorna estadio con sectores', async () => {
    push([{ id: 1, nombre: 'MetLife' }], [{ id: 1, nombre: 'Norte' }])
    const r = await estadioSvc.getEstadioConSectores(1) as any
    assert.equal(r.nombre, 'MetLife')
    assert.equal(r.sectores.length, 1)
  })
})

// ===========================================================================
// evento.service
// ===========================================================================
describe('evento.service', () => {
  beforeEach(reset)

  const EVENTO_DATA = {
    fecha: new Date('2026-07-15'),
    hora: '20:00',
    id_estadio: 1,
    id_equipo_local: 1,
    id_equipo_visitante: 2,
  }

  test('listarEventos — retorna lista', async () => {
    push([{ id: 1 }, { id: 2 }])
    const r = await eventoSvc.listarEventos()
    assert.equal(r.length, 2)
  })

  test('getEvento — no encontrado lanza error', async () => {
    push([])
    await assert.rejects(() => eventoSvc.getEvento(999), /Evento no encontrado/)
  })

  test('getEvento — encontrado con sectores', async () => {
    push([{ id: 1, nombre_estadio: 'MetLife' }], [{ id_sector: 1, nombre: 'Norte' }])
    const r = await eventoSvc.getEvento(1) as any
    assert.ok(r.sectores)
    assert.equal(r.sectores.length, 1)
  })

  test('crearEvento — sin permisos lanza error', async () => {
    push([])
    await assert.rejects(() => eventoSvc.crearEvento(EVENTO_DATA, 'admin@test.com'), /permisos para crear/)
  })

  test('crearEvento — éxito', async () => {
    push([{ id: 1 }], [{ id: 1, id_estadio: 1 }])
    const r = await eventoSvc.crearEvento(EVENTO_DATA, 'admin@test.com') as any
    assert.equal(r.id, 1)
  })

  test('habilitarSectores — evento no encontrado lanza error', async () => {
    push([])
    await assert.rejects(
      () => eventoSvc.habilitarSectores(99, { sectores: [{ id_sector: 1, costo_entrada: 100 }] }, 'a@a.com'),
      /Evento no encontrado/,
    )
  })

  test('habilitarSectores — sin permisos lanza error', async () => {
    push([{ id_estadio: 1 }], [])
    await assert.rejects(
      () => eventoSvc.habilitarSectores(1, { sectores: [{ id_sector: 1, costo_entrada: 100 }] }, 'a@a.com'),
      /Sin permisos/,
    )
  })

  test('habilitarSectores — éxito', async () => {
    push([{ id_estadio: 1 }], [{ id: 1 }], [{ id_sector: 1, id_evento: 1, costo_entrada: '100' }])
    const r = await eventoSvc.habilitarSectores(1, { sectores: [{ id_sector: 1, costo_entrada: 100 }] }, 'a@a.com')
    assert.equal(r.length, 1)
  })

  test('asignarFuncionario — no existe lanza error', async () => {
    push([])
    await assert.rejects(() => eventoSvc.asignarFuncionario(1, 1, 'L99'), /no existe en el sistema/)
  })

  test('asignarFuncionario — éxito', async () => {
    push([{ numero_legajo: 'L1' }], [])
    const r = await eventoSvc.asignarFuncionario(1, 1, 'L1') as any
    assert.equal(r.ok, true)
  })
})

// ===========================================================================
// reportes.service
// ===========================================================================
describe('reportes.service', () => {
  beforeEach(reset)

  test('eventosMasVendidos — retorna lista', async () => {
    push([{ id: 1, total_entradas: 50 }])
    const r = await reportesSvc.eventosMasVendidos()
    assert.equal(r.length, 1)
  })

  test('rankingCompradores — retorna lista', async () => {
    push([{ email: 'u@test.com', total_entradas: 3 }])
    const r = await reportesSvc.rankingCompradores()
    assert.equal(r.length, 1)
  })
})

// ===========================================================================
// Routes — HTTP layer coverage
// ===========================================================================
describe('routes — HTTP layer', () => {
  const app = makeApp()
  beforeEach(reset)

  // --- auth routes ---
  describe('POST /auth/register', () => {
    test('400 con body inválido', async () => {
      const res = await app.fetch(new Request('http://x/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }))
      assert.equal(res.status, 400)
    })

    test('409 si email duplicado', async () => {
      push([{ email: 'u@test.com' }])
      const res = await app.fetch(new Request('http://x/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(BASE_PERFIL),
      }))
      assert.equal(res.status, 409)
    })

    test('201 con datos válidos', async () => {
      push([], [])  // email, doc checks
      const res = await app.fetch(new Request('http://x/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(BASE_PERFIL),
      }))
      assert.equal(res.status, 201)
    })
  })

  describe('POST /auth/login', () => {
    test('401 con credenciales inválidas', async () => {
      push([])
      const res = await app.fetch(new Request('http://x/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'u@test.com', password: 'bad' }),
      }))
      assert.equal(res.status, 401)
    })

    test('200 con credenciales válidas', async () => {
      push([{ password_hash: hashPassword('pass12345'), rol: 'usuario_general' }])
      const res = await app.fetch(new Request('http://x/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'u@test.com', password: 'pass12345' }),
      }))
      assert.equal(res.status, 200)
      const data = await res.json() as any
      assert.ok(data.token)
    })
  })

  describe('GET /auth/me', () => {
    test('401 sin token', async () => {
      const res = await app.fetch(new Request('http://x/auth/me'))
      assert.equal(res.status, 401)
    })

    test('200 con token válido', async () => {
      push([{ email: 'user@test.com' }], [])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })

  // --- equipos routes ---
  describe('GET /equipos', () => {
    test('200 retorna lista', async () => {
      push([{ id: 1, nombre: 'Uruguay' }])
      const res = await app.fetch(new Request('http://x/equipos'))
      assert.equal(res.status, 200)
    })
  })

  describe('GET /equipos/:id', () => {
    test('404 si no existe', async () => {
      push([])
      const res = await app.fetch(new Request('http://x/equipos/999'))
      assert.equal(res.status, 404)
    })

    test('200 si existe', async () => {
      push([{ id: 1, nombre: 'Uruguay' }])
      const res = await app.fetch(new Request('http://x/equipos/1'))
      assert.equal(res.status, 200)
    })
  })

  // --- estadios routes ---
  describe('GET /estadios', () => {
    test('200 retorna lista', async () => {
      push([{ id: 1 }])
      const res = await app.fetch(new Request('http://x/estadios'))
      assert.equal(res.status, 200)
    })
  })

  describe('POST /estadios/:id/sectores', () => {
    test('403 sin rol admin', async () => {
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/estadios/1/sectores', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'Norte', capacidad_maxima: 100 }),
      }))
      assert.equal(res.status, 403)
    })

    test('201 con rol admin', async () => {
      push([{ id: 1 }], [{ id: 1, nombre: 'Norte' }])
      const token = await adminToken()
      const res = await app.fetch(new Request('http://x/estadios/1/sectores', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'Norte', capacidad_maxima: 100 }),
      }))
      assert.equal(res.status, 201)
    })
  })

  // --- eventos routes ---
  describe('GET /eventos', () => {
    test('200 retorna lista', async () => {
      push([{ id: 1 }])
      const res = await app.fetch(new Request('http://x/eventos'))
      assert.equal(res.status, 200)
    })
  })

  describe('POST /eventos', () => {
    test('400 si sin permisos sobre estadio', async () => {
      push([])
      const token = await adminToken()
      const res = await app.fetch(new Request('http://x/eventos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: '2026-07-15', hora: '20:00', id_estadio: 1, id_equipo_local: 1, id_equipo_visitante: 2 }),
      }))
      assert.equal(res.status, 400)
    })
  })

  // --- ventas routes ---
  describe('POST /ventas', () => {
    test('401 sin token', async () => {
      const res = await app.fetch(new Request('http://x/ventas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }))
      assert.equal(res.status, 401)
    })

    test('400 si sin comisión', async () => {
      push([])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/ventas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_evento: 1, entradas: [{ id_sector: 1 }] }),
      }))
      assert.equal(res.status, 400)
    })

    test('201 compra exitosa', async () => {
      push(
        [{ id: 1, monto: '0.05' }],
        [{ id_sector: 1, costo_entrada: '100', capacidad_maxima: 10, vendidas: '2' }],
        [{ id: 1, estado: 'paga', monto_total: '105', email_usuario: 'user@test.com', id_comision: 1 }],
        [{ id: 1 }],
      )
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/ventas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_evento: 1, entradas: [{ id_sector: 1 }] }),
      }))
      assert.equal(res.status, 201)
    })
  })

  describe('GET /ventas', () => {
    test('200 retorna mis ventas', async () => {
      push([{ id: 1 }])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/ventas', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })

  // --- entradas routes ---
  describe('GET /entradas', () => {
    test('200 retorna mis entradas', async () => {
      push([{ id: 1 }])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/entradas', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })

  describe('GET /entradas/:id', () => {
    test('404 si no encontrada', async () => {
      push([])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/entradas/99', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 404)
    })

    test('200 si encontrada', async () => {
      push([{ id: 1 }])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/entradas/1', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })

  // --- transferencias routes ---
  describe('POST /transferencias', () => {
    test('400 si no propietario', async () => {
      push([])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/transferencias', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_entrada: 1, email_destino: 'd@test.com' }),
      }))
      assert.equal(res.status, 400)
    })
  })

  describe('GET /transferencias', () => {
    test('200 retorna historial', async () => {
      push([{ id: 1 }])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/transferencias', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })

  describe('GET /transferencias/pendientes', () => {
    test('200 retorna pendientes', async () => {
      push([{ id: 1 }])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/transferencias/pendientes', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })

  describe('POST /transferencias/:id/responder', () => {
    test('400 si no encontrada', async () => {
      push([])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/transferencias/1/responder', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'aceptar' }),
      }))
      assert.equal(res.status, 400)
    })
  })

  describe('POST /transferencias/:id/cancelar', () => {
    test('400 si no encontrada', async () => {
      push([])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/transferencias/1/cancelar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 400)
    })
  })

  // --- QR routes ---
  describe('GET /qr/:id_entrada', () => {
    test('401 sin token', async () => {
      const res = await app.fetch(new Request('http://x/qr/1'))
      assert.equal(res.status, 401)
    })

    test('400 si no propietario', async () => {
      push([])
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/qr/1', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 400)
    })

    test('200 retorna QR', async () => {
      push(
        [{ id: 1, consumida: false }],
        [],
        [{ id: 1, codigo_rotativo: 'TEST1234', fecha_creacion: new Date(), fecha_de_uso: null, id_entrada: 1, id_dispositivo_validacion: null }],
      )
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/qr/1', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
      const data = await res.json() as any
      assert.ok(data.codigo_rotativo)
      assert.equal(data.expira_en, 30)
    })
  })

  // --- reportes routes ---
  describe('GET /reportes/eventos-mas-vendidos', () => {
    test('401 sin token', async () => {
      const res = await app.fetch(new Request('http://x/reportes/eventos-mas-vendidos'))
      assert.equal(res.status, 401)
    })

    test('403 sin rol admin', async () => {
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/reportes/eventos-mas-vendidos', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 403)
    })

    test('200 con rol admin', async () => {
      push([{ id: 1 }])
      const token = await adminToken()
      const res = await app.fetch(new Request('http://x/reportes/eventos-mas-vendidos', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })

  describe('GET /reportes/ranking-compradores', () => {
    test('200 con rol admin', async () => {
      push([{ email: 'u@test.com' }])
      const token = await adminToken()
      const res = await app.fetch(new Request('http://x/reportes/ranking-compradores', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })
})

// ===========================================================================
// dispositivo.service
// ===========================================================================
describe('dispositivo.service', () => {
  beforeEach(reset)

  test('listarDispositivos — retorna lista', async () => {
    push([{ id: 'uuid-1' }])
    const r = await dispositivoSvc.listarDispositivos()
    assert.equal(r.length, 1)
  })

  test('crearDispositivo — funcionario no encontrado lanza error', async () => {
    push([])
    await assert.rejects(() => dispositivoSvc.crearDispositivo('L99', 'Puerta Norte'), /Funcionario no encontrado/)
  })

  test('crearDispositivo — éxito', async () => {
    push([{ numero_legajo: 'L1' }], [{ id: 'uuid-1', numero_legajo: 'L1', nombre: 'Puerta Norte' }])
    const r = await dispositivoSvc.crearDispositivo('L1', 'Puerta Norte') as any
    assert.equal(r.numero_legajo, 'L1')
    assert.equal(r.nombre, 'Puerta Norte')
  })

  test('actualizarDispositivo — éxito', async () => {
    push([{ id: 'uuid-1', nombre: 'Puerta Sur', numero_legajo: 'L1' }])
    const r = await dispositivoSvc.actualizarDispositivo('uuid-1', { nombre: 'Puerta Sur' }) as any
    assert.equal(r.nombre, 'Puerta Sur')
  })

  test('actualizarDispositivo — no encontrado lanza error', async () => {
    push([])
    await assert.rejects(() => dispositivoSvc.actualizarDispositivo('uuid-x', { nombre: 'X' }), /no encontrado/)
  })

  test('eliminarDispositivo — no encontrado lanza error', async () => {
    push([])
    await assert.rejects(() => dispositivoSvc.eliminarDispositivo('uuid-1'), /no encontrado/)
  })

  test('eliminarDispositivo — éxito', async () => {
    push([{ id: 'uuid-1' }])
    const r = await dispositivoSvc.eliminarDispositivo('uuid-1') as any
    assert.equal(r.ok, true)
  })

  test('sectoresAsignadosFuncionario — retorna lista', async () => {
    push([{ id_sector: 1 }])
    const r = await dispositivoSvc.sectoresAsignadosFuncionario('func@test.com')
    assert.equal(r.length, 1)
  })
})

// ===========================================================================
// qr.service — validarQR
// ===========================================================================
describe('qr.service — validarQR', () => {
  beforeEach(reset)

  const DEVICE_ID = '550e8400-e29b-41d4-a716-446655440001'
  const EMAIL = 'func@test.com'
  const QR_VIGENTE = { id: 1, id_entrada: 1, id_evento: 1, id_sector: 1, consumida: false, fecha_de_uso: null, id_dispositivo_validacion: null, vigente: true }
  const FUNC = { numero_legajo: 'L1' }
  const DEVICE = { id: DEVICE_ID }

  test('dispositivo no autorizado lanza error', async () => {
    push([])
    await assert.rejects(() => qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1), /Dispositivo no autorizado/)
  })

  test('funcionario no encontrado lanza error', async () => {
    push([DEVICE], [])
    await assert.rejects(() => qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1), /Funcionario no encontrado/)
  })

  test('QR no encontrado lanza error', async () => {
    push([DEVICE], [FUNC], [])
    await assert.rejects(() => qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1), /QR inválido/)
  })

  test('idempotente: mismo dispositivo, QR ya usado retorna ok', async () => {
    push([DEVICE], [FUNC], [{ ...QR_VIGENTE, fecha_de_uso: new Date(), id_dispositivo_validacion: DEVICE_ID }])
    const r = await qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1) as any
    assert.equal(r.ok, true)
  })

  test('QR ya consumido por otro dispositivo lanza error', async () => {
    push([DEVICE], [FUNC], [{ ...QR_VIGENTE, fecha_de_uso: new Date(), id_dispositivo_validacion: 'other-uuid' }])
    await assert.rejects(() => qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1), /ya fue consumida/)
  })

  test('QR expirado lanza error', async () => {
    push([DEVICE], [FUNC], [{ ...QR_VIGENTE, vigente: false }])
    await assert.rejects(() => qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1), /expirado/)
  })

  test('evento/sector no coincide con selección del funcionario lanza error', async () => {
    // QR is for id_evento=1 but funcionario selected id_evento=2 → mismatch → query info + throw
    push([DEVICE], [FUNC], [QR_VIGENTE], [{ local: 'Uruguay', visitante: 'Argentina' }])
    await assert.rejects(() => qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 2), /no corresponde al sector\/evento seleccionado/)
  })

  test('dispositivo de otro evento lanza error', async () => {
    // device found, funcionario found, QR found (matching sector/event), dispositivo_evento not found
    push([DEVICE], [FUNC], [QR_VIGENTE], [])
    await assert.rejects(() => qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1), /no autorizado para este evento/)
  })

  test('funcionario no asignado al sector lanza error', async () => {
    // device, funcionario, QR, dispositivo_evento ok, asignado_a empty, evento info
    push([DEVICE], [FUNC], [QR_VIGENTE], [{ 1: 1 }], [], [{ local: 'Uruguay', visitante: 'Argentina' }])
    await assert.rejects(() => qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1), /no estás asignado a ese partido/)
  })

  test('validación exitosa retorna info de sector', async () => {
    push(
      [DEVICE],
      [FUNC],
      [QR_VIGENTE],
      [{ 1: 1 }],  // dispositivo_evento autorizado
      [{ id: 1 }], // asignado_a
    )
    // begin: UPDATE qr, UPDATE entrada, UPDATE asignado_a
    push([], [], [])
    // SELECT info para notificación
    push([{ email: 'u@test.com', nombre_sector: 'Norte', nombre_estadio: 'MetLife', nombre_equipo_local: 'Uruguay', nombre_equipo_visitante: 'Argentina' }])
    const r = await qrSvc.validarQR('ABCD1234', DEVICE_ID, EMAIL, 1, 1) as any
    assert.equal(r.ok, true)
    assert.equal(r.nombre_sector, 'Norte')
  })
})

// ===========================================================================
// Routes — QR funcionario routes
// ===========================================================================
describe('routes — QR funcionario', () => {
  const app = makeApp()
  beforeEach(reset)

  describe('GET /qr/sectores/:id_evento', () => {
    test('403 sin rol funcionario', async () => {
      const token = await userToken()
      const res = await app.fetch(new Request('http://x/qr/sectores/1', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 403)
    })

    test('200 retorna sectores', async () => {
      push([{ numero_legajo: 'L1' }], [{ id_sector: 1 }])
      const token = await funcToken()
      const res = await app.fetch(new Request('http://x/qr/sectores/1', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })

  describe('GET /qr/funcionario/me', () => {
    test('200 retorna sectores del funcionario', async () => {
      push([{ id_sector: 1 }])
      const token = await funcToken()
      const res = await app.fetch(new Request('http://x/qr/funcionario/me', {
        headers: { Authorization: `Bearer ${token}` },
      }))
      assert.equal(res.status, 200)
    })
  })
})

// ===========================================================================
// Routes — POST /qr/validar
// ===========================================================================
describe('routes — POST /qr/validar', () => {
  const app = makeApp()
  beforeEach(reset)

  const VALID_DEVICE = '550e8400-e29b-41d4-a716-446655440001'
  const QR_ROW = { id: 1, id_entrada: 1, id_evento: 1, id_sector: 1, consumida: false, fecha_de_uso: null, id_dispositivo_validacion: null, vigente: true }
  const DISP = { id: VALID_DEVICE, numero_legajo: 'L1', id_evento: 1 }

  test('403 sin rol funcionario', async () => {
    const token = await userToken()
    const res = await app.fetch(new Request('http://x/qr/validar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_rotativo: 'ABCD1234', id_dispositivo: VALID_DEVICE, id_sector: 1, id_evento: 1 }),
    }))
    assert.equal(res.status, 403)
  })

  test('400 si dispositivo no autorizado', async () => {
    push([])
    const token = await funcToken()
    const res = await app.fetch(new Request('http://x/qr/validar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_rotativo: 'ABCD1234', id_dispositivo: VALID_DEVICE, id_sector: 1, id_evento: 1 }),
    }))
    assert.equal(res.status, 400)
  })

  test('200 con validación exitosa', async () => {
    // device exists, funcionario found, QR, dispositivo_evento, asignado_a
    push([{ id: VALID_DEVICE }], [{ numero_legajo: 'L1' }], [QR_ROW], [{ 1: 1 }], [{ id: 1 }])
    // tx: UPDATE qr, UPDATE entrada, UPDATE asignado_a
    push([], [], [])
    // SELECT info notificación
    push([{ email: 'u@test.com', nombre_sector: 'Norte', nombre_estadio: 'MetLife', nombre_equipo_local: 'Uruguay', nombre_equipo_visitante: 'Argentina' }])
    const token = await funcToken()
    const res = await app.fetch(new Request('http://x/qr/validar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_rotativo: 'ABCD1234', id_dispositivo: VALID_DEVICE, id_sector: 1, id_evento: 1 }),
    }))
    assert.equal(res.status, 200)
    const data = await res.json() as any
    assert.equal(data.ok, true)
    assert.equal(data.nombre_sector, 'Norte')
  })
})

// ===========================================================================
// estadio.service — funciones no cubiertas
// ===========================================================================
describe('estadio.service — adicionales', () => {
  beforeEach(reset)

  test('getEstadio — no encontrado lanza error', async () => {
    push([])
    await assert.rejects(() => estadioSvc.getEstadio(999), /Estadio no encontrado/)
  })

  test('getEstadio — encontrado', async () => {
    push([{ id: 1, nombre: 'MetLife' }])
    const r = await estadioSvc.getEstadio(1) as any
    assert.equal(r.nombre, 'MetLife')
  })

  test('crearEstadio — retorna nuevo estadio', async () => {
    push([{ id: 7, nombre: 'Nuevo' }])
    const r = await estadioSvc.crearEstadio({ nombre: 'Nuevo' }) as any
    assert.equal(r.nombre, 'Nuevo')
  })

  test('listarSectores — retorna lista', async () => {
    push([{ id: 1, nombre: 'Norte' }])
    const r = await estadioSvc.listarSectores(1)
    assert.equal(r.length, 1)
  })

  test('asignarEstadioAdmin — retorna fila', async () => {
    push([{ email_admin: 'a@a.com', id_estadio: 1 }])
    const r = await estadioSvc.asignarEstadioAdmin('a@a.com', 1) as any
    assert.equal(r.id_estadio, 1)
  })

  test('eventosEnEstadio — retorna lista', async () => {
    push([{ id: 1 }])
    const r = await estadioSvc.eventosEnEstadio(1)
    assert.equal(r.length, 1)
  })
})

// ===========================================================================
// evento.service — getAsignaciones
// ===========================================================================
describe('evento.service — adicionales', () => {
  beforeEach(reset)

  test('getAsignaciones — retorna lista', async () => {
    push([{ numero_legajo: 'L1' }])
    const r = await eventoSvc.getAsignaciones(1)
    assert.equal(r.length, 1)
  })
})

// ===========================================================================
// equipo.service — crearEquipo
// ===========================================================================
describe('equipo.service — adicionales', () => {
  beforeEach(reset)

  test('crearEquipo — retorna nuevo equipo', async () => {
    push([{ id: 12, nombre: 'Japón' }])
    const r = await equipoSvc.crearEquipo({ nombre: 'Japón' }) as any
    assert.equal(r.nombre, 'Japón')
  })
})

// ===========================================================================
// auth.service — listarFuncionarios
// ===========================================================================
describe('auth.service — adicionales', () => {
  beforeEach(reset)

  test('listarFuncionarios — retorna lista', async () => {
    push([{ numero_legajo: 'L1', email: 'f@f.com' }])
    const r = await authSvc.listarFuncionarios()
    assert.equal(r.length, 1)
  })
})

// ===========================================================================
// Routes — estadios y eventos adicionales
// ===========================================================================
describe('routes — estadios adicionales', () => {
  const app = makeApp()
  beforeEach(reset)

  test('POST /estadios — 201 con admin', async () => {
    push([{ id: 7, nombre: 'Nuevo' }])
    const token = await adminToken()
    const res = await app.fetch(new Request('http://x/estadios', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Nuevo Estadio' }),
    }))
    assert.equal(res.status, 201)
  })

  test('GET /estadios/:id/sectores — 200', async () => {
    push([{ id: 1, nombre: 'Norte' }])
    const res = await app.fetch(new Request('http://x/estadios/1/sectores'))
    assert.equal(res.status, 200)
  })

  test('GET /estadios/:id — 404 si no existe', async () => {
    push([])
    const res = await app.fetch(new Request('http://x/estadios/999'))
    assert.equal(res.status, 404)
  })

  test('GET /estadios/:id/eventos — 200', async () => {
    push([{ id: 1, nombre: 'MetLife' }], [{ id: 1 }])
    const res = await app.fetch(new Request('http://x/estadios/1/eventos'))
    assert.equal(res.status, 200)
  })
})

describe('routes — eventos adicionales', () => {
  const app = makeApp()
  beforeEach(reset)

  test('GET /eventos/:id — 404 si no existe', async () => {
    push([])
    const res = await app.fetch(new Request('http://x/eventos/999'))
    assert.equal(res.status, 404)
  })

  test('POST /eventos — 201 con admin', async () => {
    push([{ id: 1 }], [{ id: 1, id_estadio: 1 }])
    const token = await adminToken()
    const res = await app.fetch(new Request('http://x/eventos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: '2026-08-01', hora: '18:00', id_estadio: 1, id_equipo_local: 1, id_equipo_visitante: 2 }),
    }))
    assert.equal(res.status, 201)
  })

  test('POST /eventos/:id/sectores — 201 con admin', async () => {
    push([{ id_estadio: 1 }], [{ id: 1 }], [{ id_sector: 1, id_evento: 1, costo_entrada: '100' }])
    const token = await adminToken()
    const res = await app.fetch(new Request('http://x/eventos/1/sectores', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectores: [{ id_sector: 1, costo_entrada: 100 }] }),
    }))
    assert.equal(res.status, 201)
  })

  test('POST /eventos/:id/asignar-funcionario — 201 con admin', async () => {
    const DEVICE_UUID = '550e8400-e29b-41d4-a716-446655440001'
    // asignarFuncionario: SELECT funcionario, INSERT asignado_a
    push([{ numero_legajo: 'L1' }], [])
    // vincularEvento: SELECT dispositivo, SELECT evento, INSERT dispositivo_evento
    push([{ id: DEVICE_UUID }], [{ id: 1 }], [{ id_dispositivo: DEVICE_UUID, id_evento: 1, numero_legajo: 'L1' }])
    const token = await adminToken()
    const res = await app.fetch(new Request('http://x/eventos/1/asignar-funcionario', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sector: 1, numero_legajo: 'L1', id_dispositivo: DEVICE_UUID }),
    }))
    assert.equal(res.status, 201)
  })

  test('GET /eventos/:id/asignaciones — 200 con admin', async () => {
    push([{ numero_legajo: 'L1' }])
    const token = await adminToken()
    const res = await app.fetch(new Request('http://x/eventos/1/asignaciones', {
      headers: { Authorization: `Bearer ${token}` },
    }))
    assert.equal(res.status, 200)
  })

  test('POST /equipos — 201 con admin', async () => {
    push([{ id: 12, nombre: 'Japón' }])
    const token = await adminToken()
    const res = await app.fetch(new Request('http://x/equipos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Japón' }),
    }))
    assert.equal(res.status, 201)
  })

  test('GET /equipos/:id/eventos — 200', async () => {
    push([{ id: 1 }])
    const res = await app.fetch(new Request('http://x/equipos/1/eventos'))
    assert.equal(res.status, 200)
  })
})
