-- Cambiar codigo_rotativo de UUID a VARCHAR para soportar códigos cortos de ingreso manual
ALTER TABLE qr ALTER COLUMN codigo_rotativo TYPE VARCHAR(36) USING codigo_rotativo::text;
ALTER TABLE qr ALTER COLUMN codigo_rotativo DROP DEFAULT;
