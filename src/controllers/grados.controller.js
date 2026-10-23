const gradosService = require('../services/grados.service');

class GradosController {
  getAll(req, res, next) {
    try {
      const filters = {
        nivel: req.query.nivel,
        ciclo: req.query.ciclo
      };
      const grados = gradosService.getAllGrados(filters);
      res.status(200).json({
        success: true,
        count: grados.length,
        data: grados
      });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      const grado = gradosService.getGradoById(req.params.id);
      res.status(200).json({
        success: true,
        data: grado
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const newGrado = gradosService.createGrado(req.body);
      res.status(201).json({
        success: true,
        message: `Grado "${newGrado.nombre}" creado exitosamente`,
        data: newGrado
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const updated = gradosService.updateGrado(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: `Grado "${updated.nombre}" actualizado exitosamente`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  delete(req, res, next) {
    try {
      gradosService.deleteGrado(req.params.id);
      res.status(200).json({
        success: true,
        message: `Grado con ID ${req.params.id} eliminado correctamente`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GradosController();
