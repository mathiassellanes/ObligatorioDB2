import { z } from 'zod'

export const EquipoSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string().min(1).max(200),
  bandera: z.string().min(1).max(10).default('🏳️'),
})

export const EstadioSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string().min(1).max(200),
})

export const SectorSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string().min(1).max(100),
  capacidad_maxima: z.number().int().positive(),
  id_estadio: z.number().int().positive(),
})

export const GestionaSchema = z.object({
  email_admin: z.string().email(),
  id_estadio: z.number().int().positive(),
})

export const CreateEquipoDTO = EquipoSchema.omit({ id: true })
export const CreateEstadioDTO = EstadioSchema.omit({ id: true })
export const CreateSectorDTO = SectorSchema.omit({ id: true })

export type Equipo = z.infer<typeof EquipoSchema>
export type Estadio = z.infer<typeof EstadioSchema>
export type Sector = z.infer<typeof SectorSchema>
export type Gestiona = z.infer<typeof GestionaSchema>
export type CreateEquipoDTO = z.infer<typeof CreateEquipoDTO>
export type CreateEstadioDTO = z.infer<typeof CreateEstadioDTO>
export type CreateSectorDTO = z.infer<typeof CreateSectorDTO>
