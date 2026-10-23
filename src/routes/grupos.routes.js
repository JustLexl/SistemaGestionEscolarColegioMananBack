const express = require('express');
const router = express.Router();
const gruposController = require('../controllers/grupos.controller');

// Rutas para Grupos
router.get('/metrics', gruposController.getMetrics);
router.get('/', gruposController.getAll);
router.get('/:id', gruposController.getById);
router.post('/', gruposController.create);
router.put('/:id', gruposController.update);
router.delete('/:id', gruposController.delete);
router.patch('/:id/toggle-estado', gruposController.toggleEstado);

module.exports = router;
