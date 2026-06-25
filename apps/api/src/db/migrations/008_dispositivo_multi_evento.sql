-- Un dispositivo puede operar en múltiples eventos
CREATE TABLE dispositivo_evento (
  id_dispositivo UUID    NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
  id_evento      INTEGER NOT NULL REFERENCES evento(id) ON DELETE CASCADE,
  numero_legajo  VARCHAR(50) NOT NULL REFERENCES funcionario_de_validacion(numero_legajo),
  PRIMARY KEY (id_dispositivo, id_evento)
);

-- Migrar datos existentes
INSERT INTO dispositivo_evento (id_dispositivo, id_evento, numero_legajo)
SELECT id, id_evento, numero_legajo FROM dispositivo;

-- Quitar id_evento del dispositivo (ahora está en la tabla join)
ALTER TABLE dispositivo DROP COLUMN id_evento;
