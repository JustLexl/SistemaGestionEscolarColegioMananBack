ada# Sistema de Gestión Escolar - Colegio Manantial (Backend API)

API RESTful desarrollada con **Node.js**, **Express 5** y **MongoDB Atlas** para el Sistema de Gestión Escolar del Colegio Manantial.

Este proyecto implementa la lógica, almacenamiento de datos, validaciones y endpoints para los siguientes módulos principales:
- **Roles y Usuarios** (Administrativo, Directivos, Profesores con correo y estado)
- **Ciclos Escolares** (Planeación, Activo, Finalizado calculados por vigencia de fechas)
- **Grados** (1° a 6° de Primaria, 1° a 3° de Secundaria)
- **Grupos** (Aulas, turnos, cupos, profesores asignados, estado)
- **Materias** (Catálogo de asignaturas, claves SEP, carga horaria, asignación a grupos y docentes)
- **Profesores** (Cédula profesional, asignaciones académicas)
- **Alumnos** (Matrícula, tutor, inscripción vinculada a grupo escolar)
- **Asistencias** (Registro por alumno, fecha y estado)
- **Calificaciones** (Registro por alumno, materia, periodo y nota)
- **Importación de Datos** (Carga de alumnos, profesores, grados, grupos, materias y asistencias mediante archivos CSV y Excel, con validación y confirmación de registros)

---

## 🍃 Conexión a Base de Datos MongoDB Atlas

El backend se encuentra conectado a la base de datos MongoDB Atlas con soporte de persistencia y sincronización automática.

- **Cadena de Conexión:**
  ```env
  MONGODB_URI=mongodb+srv://<usuario>:<password>@colegiomanantial.d73mxbv.mongodb.net/colegiomanantial?retryWrites=true&w=majority
  ```
- **Base de Datos:** `colegiomanantial`
- **Colecciones Sembradas:** `roles`, `profesores`, `ciclos_escolares`, `grados`, `grupos`, `materias`, `alumnos`, `asistencias`, `calificaciones`.

---

## 📁 Estructura del Proyecto

```
BackColegioManantial/
├── .env                       # Variables de entorno locales (Puerto 3002, URI Mongo)
├── .env.example               # Plantilla de variables de entorno
├── package.json               # Configuración y scripts
├── index.js                   # Punto de entrada del servidor Express con conexión a Mongo
├── database/
│   └── schema.sql             # Esquema relacional DDL de referencia
├── scripts/
│   ├── test-mongo-connection.js # Prueba de conexión directa a MongoDB Atlas
│   ├── seed-mongo.js          # Sembrador de colecciones en MongoDB Atlas
│   ├── validar-local-cruds.js # Sub-escenario de pruebas E2E para todos los CRUDs y CORS
│   └── validar-demo2*-e2e.js  # Scripts de validación de demos de integración
└── src/
    ├── config/
    │   └── database.js        # Módulo de conexión a MongoDB Atlas (con DNS fallback)
    ├── database/
    │   ├── schemas/           # Modelos y esquemas de Mongoose
    │   └── mongoSync.service.js # Servicio de sincronización y persistencia
    ├── data/                  # Semillas de datos iniciales
    ├── models/                # Capa de datos y persistencia sincronizada
    ├── services/              # Reglas de negocio y validación académica
    ├── controllers/           # Controladores HTTP
    ├── routes/                # Rutas REST (/api)
    └── utils/                 # Parsers Excel/CSV y cálculo de ciclos escolares
```

---

## 🚀 Cómo ejecutar y probar el servidor

### 1. Variables de Entorno (`.env`)
Asegúrate de tener el archivo `.env` configurado:
```env
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb+srv://<usuario>:<password>@colegiomanantial.d73mxbv.mongodb.net/colegiomanantial?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:4200,http://localhost:3000,http://localhost:5173
```

### 2. Probar la Conexión a MongoDB Atlas
```bash
npm run db:test
```

### 3. Limpiar Base de Datos (0 documentos)
```bash
npm run db:clean
```

### 4. Ejecutar el Sub-Escenario de Pruebas Locales (Todos los CRUDs)
Ejecuta la suite integral que levanta el servidor, valida la conexión a MongoDB Atlas, ejecuta las operaciones CRUD completas y verifica las cabeceras CORS para el Frontend:
```bash
npm run test:local
```

### 5. Iniciar Servidor en Desarrollo
```bash
npm run dev
```

El servidor iniciará en `http://localhost:3002`.

---

## 🔗 Conexión con el Frontend (Angular / React)

1. **Puerto:** El backend corre en el puerto **`3002`** (`http://localhost:3002/api`), alineado exactamente con la configuración del frontend en `FrontColegioManantial/src/app/core/api/api-base-url.ts`:
   ```typescript
   export const API_BASE_URL = 'http://localhost:3002/api';
   ```
2. **CORS:** Configurado para aceptar peticiones desde cualquier origen local:
   - Angular (`http://localhost:4200`)
   - React Vite (`http://localhost:5173`)
   - React Create React App / Next.js (`http://localhost:3000`)
3. **Health Check & Estado de BD:**
   - `GET http://localhost:3002/api/health`
   - `GET http://localhost:3002/api/db/status`
