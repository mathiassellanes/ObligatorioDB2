import { z } from 'zod'

export const PerfilSchema = z.object({
  email: z.string().email(),
  documento_pais: z.string().min(2).max(100),
  documento_tipo: z.string().min(1).max(50),
  documento_numero: z.string().min(1).max(50),
  dir_pais: z.string().min(2).max(100),
  dir_localidad: z.string().min(1).max(100),
  dir_calle: z.string().min(1).max(200),
  dir_numero: z.string().min(1).max(20),
  dir_codigo_postal: z.string().min(1).max(20),
})

export const TelefonoSchema = z.object({
  email: z.string().email(),
  telefono: z.string().min(7).max(30),
})

export const CreatePerfilDTO = PerfilSchema.extend({
  password: z.string().min(8),
  telefonos: z.array(z.string().min(7).max(30)).min(1),
})

export type Perfil = z.infer<typeof PerfilSchema>
export type Telefono = z.infer<typeof TelefonoSchema>
export type CreatePerfilDTO = z.infer<typeof CreatePerfilDTO>
