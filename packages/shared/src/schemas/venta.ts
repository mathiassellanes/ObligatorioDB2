import { z } from 'zod'

export const ComisionSchema = z.object({
  id: z.number().int().positive(),
  tipo: z.string().min(1).max(100),
  monto: z.number().positive(),
})

export const VentaSchema = z.object({
  id: z.number().int().positive(),
  fecha: z.coerce.date(),
  estado: z.enum(['pendiente', 'confirmada', 'paga']),
  monto_total: z.number().positive(),
  email_usuario: z.string().email(),
  id_comision: z.number().int().positive(),
})

export const EntradaSchema = z.object({
  id: z.number().int().positive(),
  email_propietario_actual: z.string().email(),
  id_venta: z.number().int().positive(),
  id_sector: z.number().int().positive(),
  id_evento: z.number().int().positive(),
})

export const ComprarEntradasDTO = z.object({
  id_evento: z.number().int().positive(),
  entradas: z.array(
    z.object({
      id_sector: z.number().int().positive(),
    })
  ).min(1).max(5, { message: 'Máximo 5 entradas por transacción' }),
})

export type Comision = z.infer<typeof ComisionSchema>
export type Venta = z.infer<typeof VentaSchema>
export type Entrada = z.infer<typeof EntradaSchema>
export type ComprarEntradasDTO = z.infer<typeof ComprarEntradasDTO>
