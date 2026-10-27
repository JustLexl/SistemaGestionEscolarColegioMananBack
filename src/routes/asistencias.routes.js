const express = require('express');
const router = express.Router();

const asistenciasController = require('../controllers/asistencias.controller');

// Consultar todas las asistencias
router.get('/', asistenciasController.getAll);

// Consultar historial de un alumno
router.get('/alumno/:alumnoId', asistenciasController.getByAlumnoId);

// Consultar una asistencia por ID
router.get('/:id', asistenciasController.getById);

// Registrar una asistencia
router.post('/', asistenciasController.create);

// Editar una asistencia
router.put('/:id', asistenciasController.update);

// Eliminar una asistencia
router.delete('/:id', asistenciasController.delete);

module.exports = router;