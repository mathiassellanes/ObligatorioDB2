import { z } from 'zod'

export const QRSchema = z.object({
  id: z.number().int().positive(),
  codigo_rotativo: z.string().uuid(),
  fecha_creacion: z.coerce.date(),
  fecha_de_uso: z.coerce.date().nullable(),
  id_entrada: z.number().int().positive(),
  id_dispositivo_validacion: z.string().uuid().nullable(),
})

export const ValidarQRDTO = z.object({
  codigo_rotativo: z.string().uuid(),
  id_dispositivo: z.string().uuid(),
})

export type QR = z.infer<typeof QRSchema>
export type ValidarQRDTO = z.infer<typeof ValidarQRDTO>
