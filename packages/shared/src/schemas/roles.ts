import { z } from 'zod'

export const RolEnum = z.enum([
  'admin_por_pais_sede',
  'funcionario_de_validacion',
  'usuario_general',
])

export const AdminPorPaisSede = z.object({
  email: z.string().email(),
  fecha_asignacion: z.coerce.date(),
})

export const FuncionarioDeValidacion = z.object({
  numero_legajo: z.string().min(1).max(50),
  email: z.string().email(),
})

export const UsuarioGeneral = z.object({
  email: z.string().email(),
  fecha_registro: z.coerce.date(),
  estado_verificacion_identidad: z.enum(['pendiente', 'verificado', 'rechazado']),
})

export const DispositivoSchema = z.object({
  id: z.string().uuid(),
  numero_legajo: z.string().min(1).max(50),
})

export type Rol = z.infer<typeof RolEnum>
export type AdminPorPaisSede = z.infer<typeof AdminPorPaisSede>
export type FuncionarioDeValidacion = z.infer<typeof FuncionarioDeValidacion>
export type UsuarioGeneral = z.infer<typeof UsuarioGeneral>
export type Dispositivo = z.infer<typeof DispositivoSchema>
