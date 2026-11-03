const express = require('express');
const router = express.Router();
const calificacionesController = require(
  '../controllers/calificaciones.controller'
);

// Rutas para Calificaciones
router.get('/', calificacionesController.getAll);
router.get('/:id', calificacionesController.getById);
router.post('/', calificacionesController.create);
router.put('/:id', calificacionesController.update);
router.delete('/:id', calificacionesController.delete);

module.exports = router;
