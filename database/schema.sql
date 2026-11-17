-- =============================================================================
-- SISTEMA DE GESTIÓN ESCOLAR - COLEGIO MANANTIAL
-- ESQUEMA DE BASE DE DATOS PARA LAS TABLAS DE:
-- 1. Roles y Usuarios
-- 2. Profesores
-- 3. Grados Escolares
-- 4. Grupos
-- 5. Materias
-- =============================================================================

-- Desactivar temporalmente revisión de claves foráneas para recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS calificaciones;
DROP TABLE IF EXISTS materia_grupos;
DROP TABLE IF EXISTS grupo_materias;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS grupos;
DROP TABLE IF EXISTS profesores;
DROP TABLE IF EXISTS grados;
DROP TABLE IF EXISTS ciclos_escolares;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. TABLA: roles
-- Almacena los usuarios del sistema y sus roles/puestos autorizados.
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    puesto ENUM('Administrativo', 'Directivos', 'Profesores') NOT NULL DEFAULT 'Profesores',
    correo VARCHAR(150) NOT NULL UNIQUE,
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_roles_puesto (puesto),
    INDEX idx_roles_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: profesores
-- Almacena el catálogo de docentes y permite su baja lógica.
-- -----------------------------------------------------------------------------
CREATE TABLE profesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    cedula VARCHAR(30) NOT NULL UNIQUE,
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_profesores_estado (estado),
    FOREIGN KEY (usuario_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: ciclos_escolares
-- El estado se calcula en la aplicación a partir de las fechas; no se persiste.
-- -----------------------------------------------------------------------------
CREATE TABLE ciclos_escolares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_ciclo_fechas CHECK (fecha_inicio < fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: grados
-- El nombre se deriva de numero_grado y nivel.
-- -----------------------------------------------------------------------------
CREATE TABLE grados (
    id VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- Ej: '4° Primaria'
    nivel ENUM('Primaria', 'Secundaria') NOT NULL,
    numero_grado TINYINT UNSIGNED NOT NULL,
    ciclo_escolar_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ciclo_escolar_id) REFERENCES ciclos_escolares(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uq_grado_ciclo_nivel_numero (ciclo_escolar_id, nivel, numero_grado),
    CONSTRAINT chk_grado_rango CHECK (
        (nivel = 'Primaria' AND numero_grado BETWEEN 1 AND 6) OR
        (nivel = 'Secundaria' AND numero_grado BETWEEN 1 AND 3)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: grupos
-- Almacena las aulas/secciones de cada grado escolar.
-- -----------------------------------------------------------------------------
CREATE TABLE grupos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grado_id VARCHAR(10) NOT NULL,
    grado_nombre VARCHAR(50) NOT NULL,
    grupo_letra VARCHAR(5) NOT NULL, -- 'A', 'B', 'C'
    nombre VARCHAR(100) NOT NULL, -- Ej: '4° Grado - Grupo A'
    clave VARCHAR(30) NOT NULL UNIQUE, -- Ej: 'CM-PRI-4A-24'
    aula VARCHAR(50) NOT NULL, -- Ej: 'Aula 204'
    edificio VARCHAR(50) NOT NULL DEFAULT 'Edificio Principal',
    turno ENUM('matutino', 'vespertino') NOT NULL DEFAULT 'matutino',
    profesor_id INT NULL,
    profesor_nombre VARCHAR(150) NOT NULL DEFAULT 'Profesor Sin Asignar',
    profesor_iniciales VARCHAR(10) NOT NULL DEFAULT 'SA',
    cedula VARCHAR(30) NOT NULL DEFAULT 'DOC-2024-000',
    alumnos_actuales INT NOT NULL DEFAULT 0,
    alumnos_max INT NOT NULL DEFAULT 40,
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grado_id) REFERENCES grados(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON UPDATE CASCADE ON DELETE SET NULL,
    UNIQUE KEY uq_grupos_grado_letra (grado_id, grupo_letra),
    INDEX idx_grupos_grado (grado_id),
    INDEX idx_grupos_turno (turno),
    INDEX idx_grupos_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: materias
-- Almacena el catálogo y plan de estudios de asignaturas impartidas.
-- -----------------------------------------------------------------------------
CREATE TABLE materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL, -- Ej: 'MAT', 'ESP'
    nombre VARCHAR(150) NOT NULL,
    clave_sep VARCHAR(30) NOT NULL UNIQUE, -- Ej: 'MAT-PRI-04'
    carga_horaria VARCHAR(30) NOT NULL DEFAULT '4 hrs/sem',
    grado_id VARCHAR(10) NOT NULL,
    grado_nombre VARCHAR(50) NOT NULL,
    profesor_id INT NULL,
    profesor_nombre VARCHAR(150) NOT NULL DEFAULT 'Profesor Sin Asignar',
    profesor_iniciales VARCHAR(10) NOT NULL DEFAULT 'SA',
    cedula VARCHAR(30) NOT NULL DEFAULT 'DOC-2024-000',
    alumnos_impactados INT NOT NULL DEFAULT 0,
    grupos_count INT NOT NULL DEFAULT 0,
    estado ENUM('Activa', 'En planeacion', 'Inactiva') NOT NULL DEFAULT 'Activa',
    is_tronco_comun BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grado_id) REFERENCES grados(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_materias_grado (grado_id),
    INDEX idx_materias_estado (estado),
    INDEX idx_materias_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA INTERMEDIA: materia_grupos (Muchos a Muchos: Materias <-> Grupos)
-- -----------------------------------------------------------------------------
CREATE TABLE materia_grupos (
    materia_id INT NOT NULL,
    grupo_nombre VARCHAR(30) NOT NULL,
    PRIMARY KEY (materia_id, grupo_nombre),
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: calificaciones
-- Almacena las evaluaciones de los alumnos por materia y periodo.
-- -----------------------------------------------------------------------------
CREATE TABLE calificaciones (
    id VARCHAR(20) PRIMARY KEY,
    alumno VARCHAR(150) NOT NULL,
    matricula VARCHAR(30) NOT NULL,
    grado VARCHAR(50) NOT NULL,
    grupo VARCHAR(20) NOT NULL,
    materia VARCHAR(150) NOT NULL,
    periodo VARCHAR(50) NOT NULL,
    calificacion DECIMAL(3,1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_calificaciones_matricula_materia_periodo (
        matricula,
        materia,
        periodo
    ),
    CONSTRAINT chk_calificaciones_rango
        CHECK (calificacion BETWEEN 0 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
