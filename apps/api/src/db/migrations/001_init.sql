-- =============================================================
-- 001_init.sql — Schema inicial Mundial 2026 Ticketing
-- =============================================================

-- Perfil base de cualquier usuario del sistema
CREATE TABLE perfil (
  email                VARCHAR(255) PRIMARY KEY,
  documento_pais       VARCHAR(100) NOT NULL,
  documento_tipo       VARCHAR(50)  NOT NULL,
  documento_numero     VARCHAR(50)  NOT NULL,
  dir_pais             VARCHAR(100) NOT NULL,
  dir_localidad        VARCHAR(100) NOT NULL,
  dir_calle            VARCHAR(200) NOT NULL,
  dir_numero           VARCHAR(20)  NOT NULL,
  dir_codigo_postal    VARCHAR(20)  NOT NULL,
  UNIQUE (documento_pais, documento_tipo, documento_numero)
);

-- Credenciales separadas del perfil
CREATE TABLE credenciales (
  email         VARCHAR(255) PRIMARY KEY REFERENCES perfil(email) ON DELETE CASCADE,
  password_hash TEXT NOT NULL
);

-- Teléfonos de contacto (multivaluado)
CREATE TABLE telefono (
  email    VARCHAR(255) REFERENCES perfil(email) ON DELETE CASCADE,
  telefono VARCHAR(30)  NOT NULL,
  PRIMARY KEY (email, telefono)
);

-- =============================================================
-- Roles
-- =============================================================

CREATE TABLE admin_por_pais_sede (
  email            VARCHAR(255) PRIMARY KEY REFERENCES perfil(email) ON DELETE CASCADE,
  fecha_asignacion DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE funcionario_de_validacion (
  numero_legajo VARCHAR(50)  PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE REFERENCES perfil(email) ON DELETE CASCADE
);

CREATE TABLE usuario_general (
  email                          VARCHAR(255) PRIMARY KEY REFERENCES perfil(email) ON DELETE CASCADE,
  fecha_registro                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  estado_verificacion_identidad  VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
    CHECK (estado_verificacion_identidad IN ('pendiente', 'verificado', 'rechazado'))
);

-- =============================================================
-- Infraestructura
-- =============================================================

CREATE TABLE equipo (
  id     SERIAL       PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE estadio (
  id     SERIAL       PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE sector (
  id              SERIAL       PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  capacidad_maxima INTEGER     NOT NULL CHECK (capacidad_maxima > 0),
  id_estadio      INTEGER      NOT NULL REFERENCES estadio(id) ON DELETE CASCADE,
  UNIQUE (nombre, id_estadio)
);

-- Qué estadios gestiona cada admin
CREATE TABLE gestiona (
  email_admin VARCHAR(255) REFERENCES admin_por_pais_sede(email) ON DELETE CASCADE,
  id_estadio  INTEGER      REFERENCES estadio(id) ON DELETE CASCADE,
  PRIMARY KEY (email_admin, id_estadio)
);

-- =============================================================
-- Eventos
-- =============================================================

CREATE TABLE evento (
  id                  SERIAL   PRIMARY KEY,
  fecha               DATE     NOT NULL,
  hora                TIME     NOT NULL,
  id_estadio          INTEGER  NOT NULL REFERENCES estadio(id),
  id_equipo_local     INTEGER  NOT NULL REFERENCES equipo(id),
  id_equipo_visitante INTEGER  NOT NULL REFERENCES equipo(id),
  CHECK (id_equipo_local <> id_equipo_visitante)
);

-- Sectores habilitados para un evento con su precio
CREATE TABLE sector_evento (
  id_sector     INTEGER        NOT NULL REFERENCES sector(id) ON DELETE CASCADE,
  id_evento     INTEGER        NOT NULL REFERENCES evento(id) ON DELETE CASCADE,
  costo_entrada NUMERIC(10, 2) NOT NULL CHECK (costo_entrada > 0),
  PRIMARY KEY (id_sector, id_evento)
);

-- Funcionarios asignados a sectores de un evento
CREATE TABLE asignado_a (
  numero_legajo      VARCHAR(50) REFERENCES funcionario_de_validacion(numero_legajo) ON DELETE CASCADE,
  id_sector          INTEGER     NOT NULL,
  id_evento          INTEGER     NOT NULL,
  fecha              DATE        NOT NULL DEFAULT CURRENT_DATE,
  validacion_completa BOOLEAN    NOT NULL DEFAULT FALSE,
  PRIMARY KEY (numero_legajo, id_sector, id_evento),
  FOREIGN KEY (id_sector, id_evento) REFERENCES sector_evento(id_sector, id_evento)
);

-- =============================================================
-- Dispositivos
-- =============================================================

CREATE TABLE dispositivo (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_legajo VARCHAR(50)  NOT NULL REFERENCES funcionario_de_validacion(numero_legajo)
);

-- =============================================================
-- Ventas y Entradas
-- =============================================================

CREATE TABLE comision (
  id    SERIAL         PRIMARY KEY,
  tipo  VARCHAR(100)   NOT NULL,
  monto NUMERIC(5, 4)  NOT NULL CHECK (monto > 0)  -- ej: 0.0500 = 5%
);

CREATE TABLE venta (
  id           SERIAL         PRIMARY KEY,
  fecha        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  estado       VARCHAR(20)    NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmada', 'paga')),
  monto_total  NUMERIC(10, 2) NOT NULL CHECK (monto_total > 0),
  email_usuario VARCHAR(255)  NOT NULL REFERENCES usuario_general(email),
  id_comision  INTEGER        NOT NULL REFERENCES comision(id)
);

CREATE TABLE entrada (
  id                      SERIAL       PRIMARY KEY,
  email_propietario_actual VARCHAR(255) NOT NULL REFERENCES usuario_general(email),
  id_venta                INTEGER      NOT NULL REFERENCES venta(id),
  id_sector               INTEGER      NOT NULL,
  id_evento               INTEGER      NOT NULL,
  consumida               BOOLEAN      NOT NULL DEFAULT FALSE,
  FOREIGN KEY (id_sector, id_evento) REFERENCES sector_evento(id_sector, id_evento)
);

-- =============================================================
-- QR Dinámico
-- =============================================================

CREATE TABLE qr (
  id                       SERIAL       PRIMARY KEY,
  codigo_rotativo          UUID         NOT NULL DEFAULT gen_random_uuid(),
  fecha_creacion           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  fecha_de_uso             TIMESTAMPTZ,
  id_entrada               INTEGER      NOT NULL REFERENCES entrada(id),
  id_dispositivo_validacion UUID        REFERENCES dispositivo(id)
);

-- =============================================================
-- Transferencias
-- =============================================================

CREATE TABLE transferencia (
  id            SERIAL       PRIMARY KEY,
  fecha         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  estado        VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
  email_origen  VARCHAR(255) NOT NULL REFERENCES usuario_general(email),
  email_destino VARCHAR(255) NOT NULL REFERENCES usuario_general(email),
  id_entrada    INTEGER      NOT NULL REFERENCES entrada(id),
  CHECK (email_origen <> email_destino)
);

-- =============================================================
-- Constraints de negocio vía índices y funciones
-- =============================================================

-- Evitar superposición de eventos en mismo estadio (mismo día y hora solapada)
-- Se implementa via CHECK en stored procedure / trigger (ver 002_triggers.sql)

-- Índices para queries frecuentes
CREATE INDEX idx_entrada_propietario    ON entrada(email_propietario_actual);
CREATE INDEX idx_entrada_venta          ON entrada(id_venta);
CREATE INDEX idx_entrada_sector_evento  ON entrada(id_sector, id_evento);
CREATE INDEX idx_venta_usuario          ON venta(email_usuario);
CREATE INDEX idx_transferencia_entrada  ON transferencia(id_entrada);
CREATE INDEX idx_transferencia_destino  ON transferencia(email_destino);
CREATE INDEX idx_qr_entrada             ON qr(id_entrada);
CREATE INDEX idx_qr_codigo              ON qr(codigo_rotativo);
CREATE INDEX idx_evento_estadio_fecha   ON evento(id_estadio, fecha);
CREATE INDEX idx_sector_estadio         ON sector(id_estadio);
