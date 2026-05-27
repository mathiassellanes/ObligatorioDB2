-- =============================================================
-- 003_seed.sql — Datos iniciales
-- =============================================================

-- Comisión base 5%
INSERT INTO comision (tipo, monto) VALUES ('porcentaje', 0.0500);

-- Equipos del Mundial 2026
INSERT INTO equipo (nombre) VALUES
  ('Uruguay'),
  ('Argentina'),
  ('Brasil'),
  ('Francia'),
  ('Alemania'),
  ('España'),
  ('Portugal'),
  ('Inglaterra'),
  ('USA'),
  ('México'),
  ('Canadá');

-- Estadios sede
INSERT INTO estadio (nombre) VALUES
  ('MetLife Stadium'),
  ('AT&T Stadium'),
  ('SoFi Stadium'),
  ('Estadio Azteca'),
  ('BC Place'),
  ('BMO Field');
