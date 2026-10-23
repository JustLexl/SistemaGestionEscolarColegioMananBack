-- =============================================================================
-- SISTEMA DE GESTIÓN ESCOLAR - COLEGIO MANANTIAL
-- ESQUEMA DE BASE DE DATOS PARA LAS TABLAS DE:
-- 1. Roles y Usuarios
-- 2. Grados Escolares
-- 3. Grupos
-- 4. Materias
-- =============================================================================

-- Desactivar temporalmente revisión de claves foráneas para recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS materia_grupos;
DROP TABLE IF EXISTS grupo_materias;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS grupos;
DROP TABLE IF EXISTS grados;
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
-- 2. TABLA: grados
-- Almacena los niveles y grados escolares del colegio (1° a 6° de Primaria).
-- -----------------------------------------------------------------------------
CREATE TABLE grados (
    id VARCHAR(10) PRIMARY KEY, -- '1', '2', '3', '4', '5', '6'
    nombre VARCHAR(50) NOT NULL, -- Ej: '4° Primaria'
    nivel VARCHAR(50) NOT NULL DEFAULT 'Primaria',
    ciclo VARCHAR(20) NOT NULL DEFAULT '2024–2025',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: grupos
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
    INDEX idx_grupos_grado (grado_id),
    INDEX idx_grupos_turno (turno),
    INDEX idx_grupos_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: materias
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
    INDEX idx_materias_grado (grado_id),
    INDEX idx_materias_estado (estado),
    INDEX idx_materias_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA INTERMEDIA: materia_grupos (Muchos a Muchos: Materias <-> Grupos)
-- -----------------------------------------------------------------------------
CREATE TABLE materia_grupos (
    materia_id INT NOT NULL,
    grupo_nombre VARCHAR(30) NOT NULL,
    PRIMARY KEY (materia_id, grupo_nombre),
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- INSERCIÓN DE DATOS SEMILLA (SEEDS)
-- -----------------------------------------------------------------------------

-- Roles
INSERT INTO roles (id, nombre, puesto, correo, estado) VALUES
(1, 'Prof. Javier Méndez', 'Directivos', 'javier.mendez@manantial.edu.mx', 'Activo'),
(2, 'Profra. Carmen Salinas', 'Directivos', 'carmen.salinas@manantial.edu.mx', 'Activo'),
(3, 'Prof. Roberto Carlos Valdés', 'Profesores', 'roberto.valdes@manantial.edu.mx', 'Activo'),
(4, 'Profra. Elena Garro', 'Profesores', 'elena.garro@manantial.edu.mx', 'Activo'),
(5, 'Profra. Gabriela Mistral', 'Profesores', 'gabriela.mistral@manantial.edu.mx', 'Activo'),
(6, 'Prof. Alfonso Reyes', 'Profesores', 'alfonso.reyes@manantial.edu.mx', 'Activo'),
(7, 'Profra. Sofía Ramírez', 'Profesores', 'sofia.ramirez@manantial.edu.mx', 'Inactivo'),
(8, 'Prof. Miguel Ángel Torres', 'Profesores', 'miguel.torres@manantial.edu.mx', 'Activo'),
(9, 'Lic. Patricia Vega', 'Administrativo', 'patricia.vega@manantial.edu.mx', 'Activo'),
(10, 'Lic. Jorge Hernández', 'Administrativo', 'jorge.hernandez@manantial.edu.mx', 'Inactivo'),
(11, 'Psic. Ana Lucía Morales', 'Administrativo', 'ana.morales@manantial.edu.mx', 'Activo'),
(12, 'Ing. Carlos Fuentes', 'Administrativo', 'carlos.fuentes@manantial.edu.mx', 'Activo');

-- Grados
INSERT INTO grados (id, nombre, nivel, ciclo) VALUES
('1', '1° Primaria', 'Primaria', '2024–2025'),
('2', '2° Primaria', 'Primaria', '2024–2025'),
('3', '3° Primaria', 'Primaria', '2024–2025'),
('4', '4° Primaria', 'Primaria', '2024–2025'),
('5', '5° Primaria', 'Primaria', '2024–2025'),
('6', '6° Primaria', 'Primaria', '2024–2025');

-- Grupos
INSERT INTO grupos (id, grado_id, grado_nombre, grupo_letra, nombre, clave, aula, edificio, turno, profesor_id, profesor_nombre, profesor_iniciales, cedula, alumnos_actuales, alumnos_max, estado, is_base) VALUES
(1, '4', '4° Grado', 'A', '4° Grado - Grupo A', 'CM-PRI-4A-24', 'Aula 204', 'Edificio B', 'matutino', 1, 'Profra. Carmen Salinas', 'CS', 'DOC-2018-042', 36, 40, 'Activo', TRUE),
(2, '4', '4° Grado', 'B', '4° Grado - Grupo B', 'CM-PRI-4B-24', 'Aula 205', 'Edificio B', 'matutino', 2, 'Profra. Elena Garro', 'EG', 'DOC-2019-018', 36, 40, 'Activo', FALSE),
(3, '3', '3° Grado', 'A', '3° Grado - Grupo A', 'CM-PRI-3A-24', 'Aula 102', 'Edificio A', 'matutino', 3, 'Prof. Roberto Carlos Valdés', 'RV', 'DOC-2021-095', 34, 40, 'Activo', FALSE),
(4, '5', '5° Grado', 'A', '5° Grado - Grupo A', 'CM-PRI-5A-24', 'Aula 301', 'Edificio B', 'matutino', 4, 'Profra. Gabriela Mistral Nava', 'GM', 'DOC-2016-011', 35, 40, 'Activo', FALSE),
(5, '6', '6° Grado', 'A', '6° Grado - Grupo A', 'CM-PRI-6A-24', 'Aula 303', 'Edificio B', 'matutino', 5, 'Prof. Alfonso Reyes Ochoa', 'AR', 'DOC-2022-073', 35, 40, 'Activo', FALSE),
(6, '1', '1° Grado', 'A', '1° Grado - Grupo A', 'CM-PRI-1A-24', 'Aula 101', 'Edificio A', 'matutino', 6, 'Profra. Sofía Ramírez', 'SR', 'DOC-2020-031', 32, 40, 'Activo', FALSE),
(7, '2', '2° Grado', 'A', '2° Grado - Grupo A', 'CM-PRI-2A-24', 'Aula 103', 'Edificio A', 'matutino', 7, 'Prof. Miguel Ángel Torres', 'MT', 'DOC-2017-088', 35, 40, 'Activo', FALSE),
(8, '1', '1° Grado', 'B', '1° Grado - Grupo B', 'CM-PRI-1B-24', 'Aula 104', 'Edificio A', 'matutino', 6, 'Profra. Sofía Ramírez', 'SR', 'DOC-2020-031', 30, 40, 'Activo', FALSE),
(9, '2', '2° Grado', 'B', '2° Grado - Grupo B', 'CM-PRI-2B-24', 'Aula 105', 'Edificio A', 'matutino', 7, 'Prof. Miguel Ángel Torres', 'MT', 'DOC-2017-088', 33, 40, 'Activo', FALSE);

-- Materias
INSERT INTO materias (id, codigo, nombre, clave_sep, carga_horaria, grado_id, grado_nombre, profesor_id, profesor_nombre, profesor_iniciales, cedula, alumnos_impactados, grupos_count, estado, is_tronco_comun) VALUES
(1, 'MAT', 'Matemáticas IV', 'MAT-PRI-04', '6 hrs/sem', '4', '4° Primaria', 1, 'Profra. Carmen Salinas', 'CS', 'DOC-2018-042', 72, 2, 'Activa', TRUE),
(2, 'ESP', 'Lengua Materna (Español IV)', 'ESP-PRI-04', '6 hrs/sem', '4', '4° Primaria', 2, 'Profra. Elena Garro', 'EG', 'DOC-2019-018', 72, 2, 'Activa', FALSE),
(3, 'CIE', 'Ciencias Naturales y Tecnología', 'CIE-PRI-04', '4 hrs/sem', '4', '4° Primaria', 1, 'Profra. Carmen Salinas', 'CS', 'DOC-2018-042', 36, 1, 'Activa', FALSE),
(4, 'ING', 'Inglés Bilingüe (Cambridge)', 'ING-CAM-03', '5 hrs/sem', '4', '3° y 4° Primaria', 3, 'Prof. Roberto Carlos Valdés', 'RV', 'DOC-2021-095', 106, 3, 'Activa', FALSE),
(5, 'HIS', 'Historia y Geografía', 'HIS-PRI-05', '3 hrs/sem', '5', '5° Primaria', 4, 'Profra. Gabriela Mistral', 'GM', 'DOC-2016-011', 70, 2, 'Activa', FALSE),
(6, 'FCE', 'Formación Cívica y Ética IV', 'FCE-PRI-04', '2 hrs/sem', '4', '4° Primaria', 5, 'Prof. Alfonso Reyes Ochoa', 'AR', 'DOC-2022-073', 72, 2, 'Activa', FALSE),
(7, 'EDF', 'Educación Física y Deportes', 'EDF-PRI-01', '2 hrs/sem', '1', '1° a 6° Primaria', 7, 'Prof. Miguel Ángel Torres', 'MT', 'DOC-2017-088', 137, 4, 'Activa', FALSE),
(8, 'ART', 'Artes Visuales y Música', 'ART-PRI-02', '2 hrs/sem', '2', '1° y 2° Primaria', 6, 'Profra. Sofía Ramírez', 'SR', 'DOC-2020-031', 67, 2, 'Activa', FALSE),
(9, 'MAT', 'Matemáticas III', 'MAT-PRI-03', '6 hrs/sem', '3', '3° Primaria', 3, 'Prof. Roberto Carlos Valdés', 'RV', 'DOC-2021-095', 65, 2, 'Activa', FALSE),
(10, 'ESP', 'Lengua Materna (Español III)', 'ESP-PRI-03', '6 hrs/sem', '3', '3° Primaria', 3, 'Prof. Roberto Carlos Valdés', 'RV', 'DOC-2021-095', 65, 2, 'Activa', FALSE),
(11, 'MAT', 'Matemáticas V', 'MAT-PRI-05', '6 hrs/sem', '5', '5° Primaria', 4, 'Profra. Gabriela Mistral', 'GM', 'DOC-2016-011', 69, 2, 'Activa', FALSE),
(12, 'MAT', 'Matemáticas VI', 'MAT-PRI-06', '6 hrs/sem', '6', '6° Primaria', 5, 'Prof. Alfonso Reyes Ochoa', 'AR', 'DOC-2022-073', 68, 2, 'Activa', FALSE),
(13, 'ESP', 'Lengua Materna (Español VI)', 'ESP-PRI-06', '6 hrs/sem', '6', '6° Primaria', 5, 'Prof. Alfonso Reyes Ochoa', 'AR', 'DOC-2022-073', 68, 2, 'Activa', FALSE),
(14, 'CNM', 'Conocimiento del Medio II', 'CNM-PRI-02', '4 hrs/sem', '2', '2° Primaria', 7, 'Prof. Miguel Ángel Torres', 'MT', 'DOC-2017-088', 68, 2, 'Activa', FALSE),
(15, 'ROB', 'Robótica y Pensamiento Computacional', 'ROB-EXT-01', '2 hrs/sem', '5', '5° y 6° Primaria', 1, 'Profra. Carmen Salinas', 'CS', 'DOC-2018-042', 70, 2, 'En planeacion', FALSE),
(16, 'GEO', 'Geografía de México y el Mundo', 'GEO-PRI-06', '3 hrs/sem', '6', '6° Primaria', 5, 'Prof. Alfonso Reyes Ochoa', 'AR', 'DOC-2022-073', 35, 1, 'Activa', FALSE),
(17, 'FRA', 'Francés Optativo', 'FRA-OPT-01', '2 hrs/sem', '6', '6° Primaria', 2, 'Profra. Elena Garro', 'EG', 'DOC-2019-018', 33, 1, 'En planeacion', FALSE),
(18, 'CIV', 'Civismo y Valores Institucionales', 'CIV-PRI-02', '2 hrs/sem', '2', '2° Primaria', 7, 'Prof. Miguel Ángel Torres', 'MT', 'DOC-2017-088', 29, 1, 'Inactiva', FALSE);

-- Relación de Grupos por Materia
INSERT INTO materia_grupos (materia_id, grupo_nombre) VALUES
(1, '4° A'), (1, '4° B'),
(2, '4° A'), (2, '4° B'),
(3, '4° A'),
(4, '3° A'), (4, '4° A'), (4, '4° B'),
(5, '5° A'), (5, '5° B'),
(6, '4° A'), (6, '4° B'),
(7, '1° A'), (7, '2° A'), (7, '3° A'), (7, '4° A'),
(8, '1° A'), (8, '2° A'),
(9, '3° A'), (9, '3° B'),
(10, '3° A'), (10, '3° B'),
(11, '5° A'), (11, '5° B'),
(12, '6° A'), (12, '6° B'),
(13, '6° A'), (13, '6° B'),
(14, '2° A'), (14, '2° B'),
(15, '5° A'), (15, '6° A'),
(16, '6° A'),
(17, '6° B'),
(18, '2° C');
