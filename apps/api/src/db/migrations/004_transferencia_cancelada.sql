-- Add 'cancelada' state to transferencia
ALTER TABLE transferencia DROP CONSTRAINT IF EXISTS transferencia_estado_check;
ALTER TABLE transferencia ADD CONSTRAINT transferencia_estado_check
  CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'cancelada'));
