const asistenciasService = require('../services/asistencias.service');

class AsistenciasController {

  getAll(req, res, next) {
    try {
      const asistencias = asistenciasService.getAllAsistencias();

      res.json({
        success: true,
        count: asistencias.length,
        data: asistencias
      });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      const asistencia = asistenciasService.getAsistenciaById(req.params.id);

      res.json({
        success: true,
        data: asistencia
      });
    } catch (error) {
      next(error);
    }
  }

  getByAlumnoId(req, res, next) {
    try {
      const asistencias = asistenciasService.getAsistenciasByAlumnoId(
        req.params.alumnoId
      );

      res.json({
        success: true,
        count: asistencias.length,
        data: asistencias
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const asistencia = asistenciasService.createAsistencia(req.body);

      res.status(201).json({
        success: true,
        message: 'Asistencia registrada correctamente.',
        data: asistencia
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const asistencia = asistenciasService.updateAsistencia(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        message: 'Asistencia actualizada correctamente.',
        data: asistencia
      });
    } catch (error) {
      next(error);
    }
  }

  delete(req, res, next) {
    try {
      asistenciasService.deleteAsistencia(req.params.id);

      res.json({
        success: true,
        message: `Asistencia con ID ${req.params.id} eliminada correctamente.`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AsistenciasController();