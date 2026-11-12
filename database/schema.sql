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

-- Profesores
INSERT INTO profesores (id, usuario_id, nombre, cedula, estado) VALUES
(1, NULL, 'Profra. Carmen Salinas', 'DOC-2018-042', 'Activo'),
(2, NULL, 'Profra. Elena Garro', 'DOC-2019-018', 'Activo'),
(3, NULL, 'Prof. Roberto Carlos Valdés', 'DOC-2021-095', 'Activo'),
(4, NULL, 'Profra. Gabriela Mistral', 'DOC-2016-011', 'Activo'),
(5, NULL, 'Prof. Alfonso Reyes Ochoa', 'DOC-2022-073', 'Activo'),
(6, NULL, 'Profra. Sofía Ramírez', 'DOC-2020-031', 'Inactivo'),
(7, NULL, 'Prof. Miguel Ángel Torres', 'DOC-2017-088', 'Activo');

-- Ciclos escolares
INSERT INTO ciclos_escolares (id, nombre, fecha_inicio, fecha_fin) VALUES
(1, '2024–2025', '2024-08-26', '2025-07-11'),
(2, '2026–2027', '2026-08-31', '2027-07-09'),
(3, '2027–2028', '2027-08-30', '2028-07-14');

-- Grados
INSERT INTO grados (id, nombre, nivel, numero_grado, ciclo_escolar_id) VALUES
('1', '1° Primaria', 'Primaria', 1, 1),
('2', '2° Primaria', 'Primaria', 2, 1),
('3', '3° Primaria', 'Primaria', 3, 1),
('4', '4° Primaria', 'Primaria', 4, 1),
('5', '5° Primaria', 'Primaria', 5, 1),
('6', '6° Primaria', 'Primaria', 6, 1),
('7', '1° Secundaria', 'Secundaria', 1, 2);

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
(9, '2', '2° Grado', 'B', '2° Grado - Grupo B', 'CM-PRI-2B-24', 'Aula 105', 'Edificio A', 'matutino', 7, 'Prof. Miguel Ángel Torres', 'MT', 'DOC-2017-088', 33, 40, 'Activo', FALSE),
(10, '7', '1° Secundaria', 'A', '1° Secundaria - Grupo A', 'CM-SEC-1A-26', 'Aula S-101', 'Edificio Secundaria', 'matutino', 3, 'Prof. Roberto Carlos Valdés', 'RV', 'DOC-2021-095', 28, 35, 'Activo', FALSE);

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
