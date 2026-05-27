import { z } from 'zod'
import { EventoSchema } from './evento'
import { SectorSchema } from './estadio'
import { EntradaSchema } from './venta'
import { TransferenciaSchema } from './transferencia'
import { QRSchema } from './qr'

// Evento con datos de JOIN (estadio, equipos)
export const EventoConNombresSchema = EventoSchema.extend({
  nombre_estadio: z.string(),
  nombre_equipo_local: z.string(),
  nombre_equipo_visitante: z.string(),
})

// Sector habilitado para un evento con entradas vendidas
export const SectorEventoDetalleSchema = SectorSchema.extend({
  costo_entrada: z.number(),
  entradas_vendidas: z.coerce.number(),
})

// Evento detallado con sectores habilitados
export const EventoDetalleSchema = EventoConNombresSchema.extend({
  sectores: z.array(SectorEventoDetalleSchema),
})

// Entrada enriquecida con datos del evento/sector
export const EntradaConEventoSchema = EntradaSchema.extend({
  consumida: z.boolean(),
  fecha_evento: z.coerce.date(),
  hora_evento: z.string(),
  nombre_estadio: z.string(),
  nombre_equipo_local: z.string(),
  nombre_equipo_visitante: z.string(),
  nombre_sector: z.string(),
  costo_entrada: z.number(),
})

// Transferencia enriquecida
export const TransferenciaConEventoSchema = TransferenciaSchema.extend({
  id_evento: z.number(),
  id_sector: z.number(),
  fecha_evento: z.coerce.date(),
  nombre_equipo_local: z.string(),
  nombre_equipo_visitante: z.string(),
  nombre_sector: z.string(),
})

// QR con expiración
export const QRActivoSchema = QRSchema.extend({
  expira_en: z.number(),
})

export type EventoConNombres = z.infer<typeof EventoConNombresSchema>
export type SectorEventoDetalle = z.infer<typeof SectorEventoDetalleSchema>
export type EventoDetalle = z.infer<typeof EventoDetalleSchema>
export type EntradaConEvento = z.infer<typeof EntradaConEventoSchema>
export type TransferenciaConEvento = z.infer<typeof TransferenciaConEventoSchema>
export type QRActivo = z.infer<typeof QRActivoSchema>
