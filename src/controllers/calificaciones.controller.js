const calificacionesService = require('../services/calificaciones.service');

class CalificacionesController {
  getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        grado: req.query.grado,
        grupo: req.query.grupo,
        materia: req.query.materia,
        periodo: req.query.periodo
      };
      const calificaciones = calificacionesService.getAllCalificaciones(
        filters
      );

      res.status(200).json({
        success: true,
        count: calificaciones.length,
        data: calificaciones
      });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      const calificacion = calificacionesService.getCalificacionById(
        req.params.id
      );

      res.status(200).json({
        success: true,
        data: calificacion
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const calificacion = calificacionesService.createCalificacion(
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Calificación registrada correctamente.',
        data: calificacion
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const calificacion = calificacionesService.updateCalificacion(
        req.params.id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Calificación actualizada correctamente.',
        data: calificacion
      });
    } catch (error) {
      next(error);
    }
  }

  delete(req, res, next) {
    try {
      calificacionesService.deleteCalificacion(req.params.id);

      res.status(200).json({
        success: true,
        message: `Calificación con ID ${req.params.id} eliminada correctamente.`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CalificacionesController();
