const express = require('express');
const router = express.Router();
const alumnosController = require('../controllers/alumnos.controller');

// Rutas para Alumnos
router.get('/', alumnosController.getAll);
router.get('/:id', alumnosController.getById);
router.post('/', alumnosController.create);
router.put('/:id', alumnosController.update);
router.patch('/:id/dar-de-baja', alumnosController.darDeBaja);
router.delete('/:id', alumnosController.delete);

module.exports = router;