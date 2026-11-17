const express = require('express');
const router = express.Router();
const { getDBStatus } = require('../config/database');
const mongoSync = require('../database/mongoSync.service');

const rolesRoutes = require('./roles.routes');
const gradosRoutes = require('./grados.routes');
const gruposRoutes = require('./grupos.routes');
const materiasRoutes = require('./materias.routes');
const asistenciasRoutes = require('./asistencias.routes');
const alumnosRoutes = require('./alumnos.routes');
const profesoresRoutes = require('./profesores.routes');
const calificacionesRoutes = require('./calificaciones.routes');
const authRoutes = require('./auth.routes');
const importacionRoutes = require('./importacion.routes');
const ciclosEscolaresRoutes = require('./ciclos-escolares.routes');

// Verificación de estado de la API
router.get('/health', async (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'ok',
    service: 'Sistema de Gestión Escolar Colegio Manantial - API Backend',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Verificación detallada de MongoDB
router.get('/db/status', async (req, res) => {
  const dbStatus = getDBStatus();
  const counts = await mongoSync.getCollectionCounts();
  res.status(200).json({
    success: true,
    database: dbStatus,
    collections: counts
  });
});

// Módulos
router.use('/roles', rolesRoutes);
router.use('/ciclos-escolares', ciclosEscolaresRoutes);
router.use('/grados', gradosRoutes);
router.use('/grupos', gruposRoutes);
router.use('/materias', materiasRoutes);
router.use('/asistencias', asistenciasRoutes);
router.use('/alumnos', alumnosRoutes);
router.use('/profesores', profesoresRoutes);
router.use('/calificaciones', calificacionesRoutes);
router.use('/auth', authRoutes);
router.use('/importacion', importacionRoutes);

module.exports = router;
