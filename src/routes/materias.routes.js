const express = require('express');
const router = express.Router();
const materiasController = require('../controllers/materias.controller');

// Rutas para Materias
router.get('/metrics', materiasController.getMetrics);
router.get('/', materiasController.getAll);
router.get('/:id', materiasController.getById);
router.post('/', materiasController.create);
router.put('/:id', materiasController.update);
router.delete('/:id', materiasController.delete);
router.patch('/:id/dar-de-baja', materiasController.darDeBaja);

module.exports = router;
