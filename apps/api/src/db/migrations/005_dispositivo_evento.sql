-- Dispositivo is now per funcionario+event pair
TRUNCATE TABLE dispositivo CASCADE;
ALTER TABLE dispositivo ADD COLUMN id_evento INTEGER NOT NULL REFERENCES evento(id);
