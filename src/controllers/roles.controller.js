const rolesService = require('../services/roles.service');

class RolesController {
  getAll(req, res, next) {
    try {
      const filters = {
        searchTerm: req.query.search || req.query.searchTerm,
        estado: req.query.estado,
        puesto: req.query.puesto
      };
      const roles = rolesService.getAllRoles(filters);
      res.status(200).json({
        success: true,
        count: roles.length,
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      const rol = rolesService.getRolById(req.params.id);
      res.status(200).json({
        success: true,
        data: rol
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const newRol = rolesService.createRol(req.body);
      res.status(201).json({
        success: true,
        message: `Usuario "${newRol.nombre}" registrado exitosamente`,
        data: newRol
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const updated = rolesService.updateRol(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: `Usuario "${updated.nombre}" actualizado exitosamente`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  delete(req, res, next) {
    try {
      rolesService.deleteRol(req.params.id);
      res.status(200).json({
        success: true,
        message: `Usuario con ID ${req.params.id} eliminado del sistema`
      });
    } catch (error) {
      next(error);
    }
  }

  toggleEstado(req, res, next) {
    try {
      const rol = rolesService.toggleRolEstado(req.params.id);
      res.status(200).json({
        success: true,
        message: `Estado de "${rol.nombre}" cambiado a ${rol.estado}`,
        data: rol
      });
    } catch (error) {
      next(error);
    }
  }

  getMetrics(req, res, next) {
    try {
      const metrics = rolesService.getRolesMetrics();
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RolesController();
