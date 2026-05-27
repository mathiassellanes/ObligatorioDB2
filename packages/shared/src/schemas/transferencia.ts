import { z } from 'zod'

export const TransferenciaSchema = z.object({
  id: z.number().int().positive(),
  fecha: z.coerce.date(),
  estado: z.enum(['pendiente', 'aceptada', 'rechazada']),
  email_origen: z.string().email(),
  email_destino: z.string().email(),
  id_entrada: z.number().int().positive(),
})

export const CrearTransferenciaDTO = z.object({
  email_destino: z.string().email(),
  id_entrada: z.number().int().positive(),
})

export const ResponderTransferenciaDTO = z.object({
  accion: z.enum(['aceptar', 'rechazar']),
})

export type Transferencia = z.infer<typeof TransferenciaSchema>
export type CrearTransferenciaDTO = z.infer<typeof CrearTransferenciaDTO>
export type ResponderTransferenciaDTO = z.infer<typeof ResponderTransferenciaDTO>
