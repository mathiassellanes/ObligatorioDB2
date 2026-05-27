import { z } from 'zod'

export const EventoSchema = z.object({
  id: z.number().int().positive(),
  fecha: z.coerce.date(),
  hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  id_estadio: z.number().int().positive(),
  id_equipo_local: z.number().int().positive(),
  id_equipo_visitante: z.number().int().positive(),
})

export const SectorEventoSchema = z.object({
  id_sector: z.number().int().positive(),
  id_evento: z.number().int().positive(),
  costo_entrada: z.number().positive(),
})

export const AsignadoASchema = z.object({
  numero_legajo: z.string().min(1).max(50),
  id_sector: z.number().int().positive(),
  id_evento: z.number().int().positive(),
  fecha: z.coerce.date(),
  validacion_completa: z.boolean().default(false),
})

export const CreateEventoDTO = EventoSchema.omit({ id: true }).refine(
  (d) => d.id_equipo_local !== d.id_equipo_visitante,
  { message: 'Equipo local y visitante deben ser distintos' }
)

export const HabilitarSectoresDTO = z.object({
  sectores: z.array(
    z.object({
      id_sector: z.number().int().positive(),
      costo_entrada: z.number().positive(),
    })
  ).min(1),
})

export type Evento = z.infer<typeof EventoSchema>
export type SectorEvento = z.infer<typeof SectorEventoSchema>
export type AsignadoA = z.infer<typeof AsignadoASchema>
export type CreateEventoDTO = z.infer<typeof CreateEventoDTO>
export type HabilitarSectoresDTO = z.infer<typeof HabilitarSectoresDTO>
