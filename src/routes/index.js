const express = require('express');
const router = express.Router();

const rolesRoutes = require('./roles.routes');
const gradosRoutes = require('./grados.routes');
const gruposRoutes = require('./grupos.routes');
const materiasRoutes = require('./materias.routes');
const asistenciasRoutes = require('./asistencias.routes');

// Verificación de estado de la API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Sistema de Gestión Escolar Colegio Manantial - API Backend',
    timestamp: new Date().toISOString()
  });
});

// Módulos
router.use('/roles', rolesRoutes);
router.use('/grados', gradosRoutes);
router.use('/grupos', gruposRoutes);
router.use('/materias', materiasRoutes);
router.use('/asistencias', asistenciasRoutes);

module.exports = router;