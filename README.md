# Sistema de Gestión Escolar - Colegio Manantial (Backend API)

API RESTful desarrollada con **Node.js** y **Express 5** para el Sistema de Gestión Escolar del Colegio Manantial.

Este proyecto implementa la lógica, almacenamiento de datos, validaciones y endpoints para los siguientes 4 módulos principales:
- **Materias** (Catálogo de asignaturas, claves SEP, carga horaria, asignación a grupos y docentes)
- **Grados** (1° a 6° de Primaria)
- **Grupos** (Aulas, turnos, cupos, profesores asignados, estado)
- **Roles y Usuarios** (Administrativo, Directivos, Profesores con correo y estado)
- **Importación de Datos** (Carga de alumnos, profesores, grados, grupos y materias mediante archivos CSV y Excel, con validación y confirmación de registros)

---

## 📁 Estructura del Proyecto

```
SistemaColegioManantialBack/
├── package.json               # Configuración y dependencias (Express, Cors)
├── index.js                   # Punto de entrada del servidor Express
├── database/
│   └── schema.sql             # Esquema SQL relacional (Tablas DDL + Datos Semilla)
└── src/
    ├── data/                  # Semillas de datos iniciales alineadas con el Frontend
    │   ├── roles.seed.js
    │   ├── grados.seed.js
    │   ├── grupos.seed.js
    │   └── materias.seed.js
    ├── models/                # Capa de datos y persistencia en memoria (CRUD)
    │   ├── roles.model.js
    │   ├── grados.model.js
    │   ├── grupos.model.js
    │   └── materias.model.js
    ├── services/              # Capa de reglas de negocio y validación
    │   ├── roles.service.js
    │   ├── grados.service.js
    │   ├── grupos.service.js
    │   ├── importacion.service.js  #Validaciones de registros
    │   └── materias.service.js
    ├── controllers/           # Controladores HTTP (Req, Res, Códigos de estado)
    │   ├── roles.controller.js
    │   ├── grados.controller.js
    │   ├── grupos.controller.js
    │   ├── importacion.controller.js
    │   └── materias.controller.js
    └── routes/                # Definición de rutas y endpoints REST
    │    ├── index.js           # Enrutador central (/api)
    │    ├── roles.routes.js    # /api/roles
    │    ├── grados.routes.js   # /api/grados
    │    ├── grupos.routes.js   # /api/grupos
    │    ├── importacion.routes.js  # /api/importacion
    │    └── materias.routes.js # /api/materias
    └── utils/                  # Procesar archivos
          ├── excel.parser.js   # Lectura de archivo CVS y Excel
```

---

## 🚀 Cómo ejecutar el servidor

### 1. Instalar dependencias
```bash
npm install
```
Importante: Se agregaron las dependencias `multer` y `xlsx` para el módulo de importación de datos. Si ya tenías instalado el proyecto anteriormente, ejecuta nuevamente `npm install` para instalar las nuevas dependencias y evitar errores al iniciar el servidor.

### 2. Modo Desarrollo (con autorecarga en Node 18+)
```bash
npm run dev
```

### 3. Modo Producción
```bash
npm start
```

El servidor iniciará por defecto en `http://localhost:3000`.

---

## 📋 Endpoints Disponibles

### Base & Health Check
- `GET /` - Información general de la API
- `GET /api/health` - Estado de salud del servicio

---

### 1. Módulo: Roles (`/api/roles`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/roles` | Lista roles con filtros (`?search=`, `?estado=`, `?puesto=`) |
| `GET` | `/api/roles/metrics` | Métricas KPI (Total, Activos, Inactivos) |
| `GET` | `/api/roles/:id` | Detalle de un rol por ID |
| `POST` | `/api/roles` | Registrar nuevo usuario/rol |
| `PUT` | `/api/roles/:id` | Actualizar rol existente |
| `DELETE` | `/api/roles/:id` | Eliminar rol por ID |
| `PATCH` | `/api/roles/:id/toggle-estado` | Alternar estado entre 'Activo' e 'Inactivo' |

---

### 2. Módulo: Grados (`/api/grados`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/grados` | Listar todos los grados (`?nivel=`, `?ciclo=`) |
| `GET` | `/api/grados/:id` | Detalle de un grado por ID |
| `POST` | `/api/grados` | Crear nuevo grado escolar |
| `PUT` | `/api/grados/:id` | Actualizar grado existente |
| `DELETE` | `/api/grados/:id` | Eliminar grado |

---

### 3. Módulo: Grupos (`/api/grupos`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/grupos` | Listar grupos con filtros (`?search=`, `?gradoId=`, `?turno=`, `?estado=`) |
| `GET` | `/api/grupos/metrics` | Métricas KPI (Total, Activos, Grados, Aulas, Matrícula total, Promedio) |
| `GET` | `/api/grupos/:id` | Detalle de un grupo por ID |
| `POST` | `/api/grupos` | Registrar nuevo grupo escolar |
| `PUT` | `/api/grupos/:id` | Actualizar datos del grupo |
| `DELETE` | `/api/grupos/:id` | Eliminar grupo por ID |
| `PATCH` | `/api/grupos/:id/toggle-estado` | Alternar estado (Activo / Inactivo) |

---

### 4. Módulo: Materias (`/api/materias`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/materias` | Listar materias (`?search=`, `?gradoId=`, `?grupo=`, `?estado=`) |
| `GET` | `/api/materias/metrics` | Métricas KPI (Total, Activas, En planeación, Inactivas, Alumnos impactados) |
| `GET` | `/api/materias/:id` | Detalle de una materia por ID |
| `POST` | `/api/materias` | Registrar nueva materia en el catálogo |
| `PUT` | `/api/materias/:id` | Actualizar datos de la materia |
| `DELETE` | `/api/materias/:id` | Eliminar materia por ID |
| `PATCH` | `/api/materias/:id/dar-de-baja` | Cambiar estado a 'Inactiva' (baja del plan) |

---

### 5. Módulo: Importación de Datos (`/api/importacion`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/importacion/:entidad/plantilla` | Descargar plantilla CSV (Alumnos, Profesores, Grados, Grupos y Materias) |
| `POST` | `/api/importacion/alumnos/validar` | Validar archivo CSV/XLSX de alumnos |
| `POST` | `/api/importacion/alumnos/confirmar` | Registrar alumnos válidos |
| `POST` | `/api/importacion/profesores/validar` | Validar archivo CSV/XLSX de profesores |
| `POST` | `/api/importacion/profesores/confirmar` | Registrar profesores válidos |
| `POST` | `/api/importacion/grados/validar` | Validar archivo CSV/XLSX de grados |
| `POST` | `/api/importacion/grados/confirmar` | Registrar grados válidos |
| `POST` | `/api/importacion/grupos/validar` | Validar archivo CSV/XLSX de grupos |
| `POST` | `/api/importacion/grupos/confirmar` | Registrar grupos válidos |
| `POST` | `/api/importacion/materias/validar` | Validar archivo CSV/XLSX de materias |
| `POST` | `/api/importacion/materias/confirmar` | Registrar materias válidas |

---

## 🗄️ Base de Datos Relacional (SQL)

Se incluye el archivo [`database/schema.sql`](file:///c:/Users/alexa/Documents/SistemaColegioManantialBack/database/schema.sql) con:
- Definición de tablas DDL (`roles`, `grados`, `grupos`, `materias`, `materia_grupos`).
- Índices de optimización y llaves foráneas (`FOREIGN KEY`).
- Sentencias `INSERT` con los datos semilla reales del colegio.
- Compatible con **MySQL 8+**, **MariaDB** y adaptable a **PostgreSQL** o **SQLite**.
