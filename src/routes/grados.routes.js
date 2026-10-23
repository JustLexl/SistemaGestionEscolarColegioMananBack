const express = require('express');
const router = express.Router();
const gradosController = require('../controllers/grados.controller');

// Rutas para Grados Escolares
router.get('/', gradosController.getAll);
router.get('/:id', gradosController.getById);
router.post('/', gradosController.create);
router.put('/:id', gradosController.update);
router.delete('/:id', gradosController.delete);

module.exports = router;
