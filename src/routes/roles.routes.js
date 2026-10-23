const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');

// Rutas para Roles y Usuarios del Sistema
router.get('/metrics', rolesController.getMetrics);
router.get('/', rolesController.getAll);
router.get('/:id', rolesController.getById);
router.post('/', rolesController.create);
router.put('/:id', rolesController.update);
router.delete('/:id', rolesController.delete);
router.patch('/:id/toggle-estado', rolesController.toggleEstado);

module.exports = router;
