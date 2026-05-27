import { z } from 'zod'

export const LoginDTO = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const TokenPayloadSchema = z.object({
  sub: z.string().email(),
  rol: z.enum(['admin_por_pais_sede', 'funcionario_de_validacion', 'usuario_general']),
  iat: z.number(),
  exp: z.number(),
})

export type LoginDTO = z.infer<typeof LoginDTO>
export type TokenPayload = z.infer<typeof TokenPayloadSchema>
