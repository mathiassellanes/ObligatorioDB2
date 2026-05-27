-- =============================================================
-- 002_triggers.sql — Triggers y funciones de negocio
-- =============================================================

-- Función: evitar superposición de eventos en mismo estadio
-- Asume duración de evento = 3 horas (180 min)
CREATE OR REPLACE FUNCTION check_evento_superposicion()
RETURNS TRIGGER AS $$
DECLARE
  duracion_minutos CONSTANT INTEGER := 180;
BEGIN
  IF EXISTS (
    SELECT 1 FROM evento e
    WHERE e.id_estadio = NEW.id_estadio
      AND e.id <> COALESCE(NEW.id, -1)
      AND e.fecha = NEW.fecha
      AND (
        NEW.hora < (e.hora + (duracion_minutos || ' minutes')::INTERVAL)
        AND e.hora < (NEW.hora + (duracion_minutos || ' minutes')::INTERVAL)
      )
  ) THEN
    RAISE EXCEPTION 'Superposición de eventos en estadio % el %', NEW.id_estadio, NEW.fecha;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evento_superposicion
  BEFORE INSERT OR UPDATE ON evento
  FOR EACH ROW EXECUTE FUNCTION check_evento_superposicion();

-- Función: max 5 entradas por venta
CREATE OR REPLACE FUNCTION check_max_entradas_por_venta()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM entrada WHERE id_venta = NEW.id_venta) >= 5 THEN
    RAISE EXCEPTION 'Una venta no puede tener más de 5 entradas';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_max_entradas_venta
  BEFORE INSERT ON entrada
  FOR EACH ROW EXECUTE FUNCTION check_max_entradas_por_venta();

-- Función: max 3 transferencias por entrada
CREATE OR REPLACE FUNCTION check_max_transferencias_por_entrada()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM transferencia
    WHERE id_entrada = NEW.id_entrada
      AND estado = 'aceptada'
  ) >= 3 THEN
    RAISE EXCEPTION 'La entrada % ya alcanzó el máximo de 3 transferencias', NEW.id_entrada;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_max_transferencias_entrada
  BEFORE INSERT ON transferencia
  FOR EACH ROW EXECUTE FUNCTION check_max_transferencias_por_entrada();

-- Función: no transferir entrada ya consumida
CREATE OR REPLACE FUNCTION check_entrada_no_consumida()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT consumida FROM entrada WHERE id = NEW.id_entrada) THEN
    RAISE EXCEPTION 'No se puede transferir una entrada ya consumida (id=%)', NEW.id_entrada;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entrada_no_consumida
  BEFORE INSERT ON transferencia
  FOR EACH ROW EXECUTE FUNCTION check_entrada_no_consumida();

-- Función: capacidad máxima por sector_evento (hard limit)
CREATE OR REPLACE FUNCTION check_capacidad_sector_evento()
RETURNS TRIGGER AS $$
DECLARE
  cap_max INTEGER;
  vendidas INTEGER;
BEGIN
  SELECT s.capacidad_maxima INTO cap_max
  FROM sector s
  WHERE s.id = NEW.id_sector;

  SELECT COUNT(*) INTO vendidas
  FROM entrada
  WHERE id_sector = NEW.id_sector AND id_evento = NEW.id_evento;

  IF vendidas >= cap_max THEN
    RAISE EXCEPTION 'Sector % para evento % está al máximo de capacidad (%)',
      NEW.id_sector, NEW.id_evento, cap_max;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_capacidad_sector_evento
  BEFORE INSERT ON entrada
  FOR EACH ROW EXECUTE FUNCTION check_capacidad_sector_evento();
