const profesoresService = require('../services/profesores.service');

class ProfesoresController {
  getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        estado: req.query.estado
      };
      const profesores = profesoresService.getAllProfesores(filters);

      res.status(200).json({
        success: true,
        count: profesores.length,
        data: profesores
      });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      const profesor = profesoresService.getProfesorById(req.params.id);

      res.status(200).json({
        success: true,
        data: profesor
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const profesor = profesoresService.createProfesor(req.body);

      res.status(201).json({
        success: true,
        message: 'Profesor registrado correctamente.',
        data: profesor
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const profesor = profesoresService.updateProfesor(
        req.params.id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Información del profesor actualizada correctamente.',
        data: profesor
      });
    } catch (error) {
      next(error);
    }
  }

  darDeBaja(req, res, next) {
    try {
      const profesor = profesoresService.darDeBajaProfesor(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Profesor dado de baja correctamente.',
        data: profesor
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfesoresController();
