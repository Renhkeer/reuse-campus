-- ReUse Campus - modelo de datos (SQL Server)
-- Ejecutar en SQL Server Management Studio o con:
--   sqlcmd -S localhost\SQLEXPRESS -E -f 65001 -i database/schema.sql
-- OJO: borra y vuelve a crear las tablas (se pierden los datos).

IF DB_ID('reuse_campus') IS NULL
    CREATE DATABASE reuse_campus;
GO

USE reuse_campus;
GO

-- Necesario para los índices filtrados (sqlcmd lo trae apagado; SSMS encendido)
SET QUOTED_IDENTIFIER ON;
GO

-- Se borran en orden inverso por las claves foráneas
DROP TABLE IF EXISTS entregas;
DROP TABLE IF EXISTS solicitudes;
DROP TABLE IF EXISTS publicaciones;
DROP TABLE IF EXISTS usuarios;
GO

CREATE TABLE usuarios (
    id       INT IDENTITY(1,1) PRIMARY KEY,
    nombre   NVARCHAR(100) NOT NULL,
    correo   NVARCHAR(150) NOT NULL UNIQUE,
    password NVARCHAR(100) NOT NULL, -- se guarda el hash bcrypt, nunca la contraseña real
    rol      NVARCHAR(20)  NOT NULL DEFAULT 'USUARIO' CHECK (rol IN ('USUARIO', 'ADMIN')),
    estado   NVARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'  CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE publicaciones (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    titulo           NVARCHAR(100) NOT NULL,
    descripcion      NVARCHAR(500) NOT NULL,
    categoria        NVARCHAR(50)  NOT NULL,
    modalidad        NVARCHAR(20)  NOT NULL CHECK (modalidad IN ('DONACION', 'INTERCAMBIO')),
    estado           NVARCHAR(20)  NOT NULL DEFAULT 'DISPONIBLE'
                     CHECK (estado IN ('DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA')),
    fechaPublicacion DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    usuarioId        INT           NOT NULL REFERENCES usuarios(id) -- RN02: un único propietario
);

CREATE TABLE solicitudes (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    publicacionId  INT           NOT NULL REFERENCES publicaciones(id),
    solicitanteId  INT           NOT NULL REFERENCES usuarios(id),
    mensaje        NVARCHAR(300) NOT NULL,
    fechaSolicitud DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    estado         NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                   CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA'))
);

-- RN05: un usuario no puede tener dos solicitudes PENDIENTES sobre la misma publicación
CREATE UNIQUE INDEX UX_solicitud_pendiente
    ON solicitudes (publicacionId, solicitanteId) WHERE estado = 'PENDIENTE';

-- RN08: solo una solicitud ACEPTADA por publicación
CREATE UNIQUE INDEX UX_solicitud_aceptada
    ON solicitudes (publicacionId) WHERE estado = 'ACEPTADA';

CREATE TABLE entregas (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    publicacionId INT          NOT NULL REFERENCES publicaciones(id),
    solicitudId   INT          NOT NULL UNIQUE REFERENCES solicitudes(id),
    propietarioId INT          NOT NULL REFERENCES usuarios(id),
    receptorId    INT          NOT NULL REFERENCES usuarios(id),
    fechaAcuerdo  DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
    fechaEntrega  DATETIME2    NULL, -- se llena al completar
    estado        NVARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'COMPLETADA'))
);
GO

-- Datos de prueba. La contraseña de todos es: 123456
INSERT INTO usuarios (nombre, correo, password, rol) VALUES
    (N'Administrador', 'admin@ipvg.cl', '$2b$10$plfnL0o9NZC/p1ds4uA9d./yO.np2odzWtO1ijcRFpt5Mt/BcfP2y', 'ADMIN'),
    (N'Ana Pérez',     'ana@ipvg.cl',   '$2b$10$plfnL0o9NZC/p1ds4uA9d./yO.np2odzWtO1ijcRFpt5Mt/BcfP2y', 'USUARIO'),
    (N'Benja Soto',    'benja@ipvg.cl', '$2b$10$plfnL0o9NZC/p1ds4uA9d./yO.np2odzWtO1ijcRFpt5Mt/BcfP2y', 'USUARIO'),
    (N'Carla Rojas',   'carla@ipvg.cl', '$2b$10$plfnL0o9NZC/p1ds4uA9d./yO.np2odzWtO1ijcRFpt5Mt/BcfP2y', 'USUARIO');

INSERT INTO publicaciones (titulo, descripcion, categoria, modalidad, usuarioId) VALUES
    (N'Calculadora Casio fx-82', N'Funciona perfecto, la usé en Cálculo I.', N'Calculadoras', 'DONACION', 2),
    (N'Libro Fundamentos de Programación', N'Edición 2019, algunas páginas subrayadas.', N'Libros', 'INTERCAMBIO', 2);
GO
