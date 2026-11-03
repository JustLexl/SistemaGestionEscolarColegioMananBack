const express = require('express');
const router = express.Router();
const profesoresController = require('../controllers/profesores.controller');

// Rutas para Profesores
router.get('/', profesoresController.getAll);
router.get('/:id', profesoresController.getById);
router.post('/', profesoresController.create);
router.put('/:id', profesoresController.update);
router.patch('/:id/dar-de-baja', profesoresController.darDeBaja);

module.exports = router;
