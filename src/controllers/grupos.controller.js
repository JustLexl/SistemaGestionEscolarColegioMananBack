const gruposService = require('../services/grupos.service');

class GruposController {
  getAll(req, res, next) {
    try {
      const filters = {
        searchTerm: req.query.search || req.query.searchTerm,
        gradoId: req.query.gradoId,
        turno: req.query.turno,
        estado: req.query.estado
      };
      const grupos = gruposService.getAllGrupos(filters);
      res.status(200).json({
        success: true,
        count: grupos.length,
        data: grupos
      });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      const grupo = gruposService.getGrupoById(req.params.id);
      res.status(200).json({
        success: true,
        data: grupo
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const newGrupo = gruposService.createGrupo(req.body);
      res.status(201).json({
        success: true,
        message: `Grupo "${newGrupo.nombre}" registrado exitosamente`,
        data: newGrupo
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const updated = gruposService.updateGrupo(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: `Grupo "${updated.nombre}" actualizado exitosamente`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  delete(req, res, next) {
    try {
      gruposService.deleteGrupo(req.params.id);
      res.status(200).json({
        success: true,
        message: `Grupo con ID ${req.params.id} eliminado correctamente`
      });
    } catch (error) {
      next(error);
    }
  }

  toggleEstado(req, res, next) {
    try {
      const grupo = gruposService.toggleGrupoEstado(req.params.id);
      res.status(200).json({
        success: true,
        message: `Estado del grupo "${grupo.nombre}" cambiado a ${grupo.estado}`,
        data: grupo
      });
    } catch (error) {
      next(error);
    }
  }

  getMetrics(req, res, next) {
    try {
      const metrics = gruposService.getGruposMetrics();
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GruposController();
