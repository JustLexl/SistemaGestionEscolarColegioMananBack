require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes');
const { connectDB } = require('./src/config/database');
const mongoSync = require('./src/database/mongoSync.service');

const app = express();
const PORT = process.env.PORT || 3002;

// Configuración de Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de Logging básico
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Ruta raíz de bienvenida
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Sistema de Gestión Escolar Colegio Manantial - API Backend',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      dbStatus: '/api/db/status',
      roles: '/api/roles',
      ciclosEscolares: '/api/ciclos-escolares',
      grados: '/api/grados',
      grupos: '/api/grupos',
      materias: '/api/materias',
      profesores: '/api/profesores',
      alumnos: '/api/alumnos',
      asistencias: '/api/asistencias',
      calificaciones: '/api/calificaciones',
      auth: '/api/auth',
      importacion: '/api/importacion'
    }
  });
});

// Modelos para sincronización con MongoDB
const allModels = {
  rolesModel: require('./src/models/roles.model'),
  profesoresModel: require('./src/models/profesores.model'),
  ciclosModel: require('./src/models/ciclos-escolares.model'),
  gradosModel: require('./src/models/grados.model'),
  gruposModel: require('./src/models/grupos.model'),
  materiasModel: require('./src/models/materias.model'),
  alumnosModel: require('./src/models/alumnos.model'),
  asistenciasModel: require('./src/models/asistencias.model'),
  calificacionesModel: require('./src/models/calificaciones.model'),
};

// Sincronizar con MongoDB antes de procesar peticiones cuando la BD está conectada
app.use('/api', async (req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await mongoSync.hydrateModels(allModels);
    } catch (err) {
      console.warn('[MongoSync Middleware]:', err.message);
    }
  }
  next();
});

// Montaje de rutas de la API
app.use('/api', apiRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('[Error Middleware]:', err.message || err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

// Conectar a MongoDB Atlas e iniciar servidor
async function startServer() {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await connectDB();
      const rolesModel = require('./src/models/roles.model');
      const profesoresModel = require('./src/models/profesores.model');
      const ciclosModel = require('./src/models/ciclos-escolares.model');
      const gradosModel = require('./src/models/grados.model');
      const gruposModel = require('./src/models/grupos.model');
      const materiasModel = require('./src/models/materias.model');
      const alumnosModel = require('./src/models/alumnos.model');
      const asistenciasModel = require('./src/models/asistencias.model');
      const calificacionesModel = require('./src/models/calificaciones.model');

      await mongoSync.hydrateModels({
        rolesModel,
        profesoresModel,
        ciclosModel,
        gradosModel,
        gruposModel,
        materiasModel,
        alumnosModel,
        asistenciasModel,
        calificacionesModel,
      });
    } catch (e) {
      console.warn('[Server] MongoDB inicialización diferida:', e.message);
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Servidor Colegio Manantial corriendo en puerto ${PORT}`);
    console.log(` Base URL: http://localhost:${PORT}`);
    console.log(` Health:   http://localhost:${PORT}/api/health`);
    console.log(` DB Info:  http://localhost:${PORT}/api/db/status`);
    console.log(` Roles:    http://localhost:${PORT}/api/roles`);
    console.log(` Ciclos:   http://localhost:${PORT}/api/ciclos-escolares`);
    console.log(` Grados:   http://localhost:${PORT}/api/grados`);
    console.log(` Grupos:   http://localhost:${PORT}/api/grupos`);
    console.log(` Materias: http://localhost:${PORT}/api/materias`);
    console.log(`====================================================`);
  });

  return server;
}

startServer();

module.exports = app;
