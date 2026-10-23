const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors());
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
      roles: '/api/roles',
      grados: '/api/grados',
      grupos: '/api/grupos',
      materias: '/api/materias'
    }
  });
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
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Servidor Colegio Manantial corriendo en puerto ${PORT}`);
  console.log(` Base URL: http://localhost:${PORT}`);
  console.log(` Health:   http://localhost:${PORT}/api/health`);
  console.log(` Roles:    http://localhost:${PORT}/api/roles`);
  console.log(` Grados:   http://localhost:${PORT}/api/grados`);
  console.log(` Grupos:   http://localhost:${PORT}/api/grupos`);
  console.log(` Materias: http://localhost:${PORT}/api/materias`);
  console.log(`====================================================`);
});

module.exports = app;
