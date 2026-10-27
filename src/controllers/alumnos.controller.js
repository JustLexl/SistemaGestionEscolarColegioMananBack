const alumnosService = require('../services/alumnos.service');

class AlumnosController {
  getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        grado: req.query.grado,
        grupo: req.query.grupo,
        estado: req.query.estado
      };

      const alumnos = alumnosService.getAllAlumnos(filters);

      res.status(200).json({
        success: true,
        count: alumnos.length,
        data: alumnos
      });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      const alumno = alumnosService.getAlumnoById(req.params.id);

      res.status(200).json({
        success: true,
        data: alumno
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const alumno = alumnosService.createAlumno(req.body);

      res.status(201).json({
        success: true,
        message: 'Alumno registrado correctamente.',
        data: alumno
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const alumno = alumnosService.updateAlumno(
        req.params.id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Información del alumno actualizada correctamente.',
        data: alumno
      });
    } catch (error) {
      next(error);
    }
  }

  darDeBaja(req, res, next) {
    try {
      const alumno = alumnosService.darDeBajaAlumno(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Alumno dado de baja correctamente.',
        data: alumno
      });
    } catch (error) {
      next(error);
    }
  }

  delete(req, res, next) {
    try {
      alumnosService.deleteAlumno(req.params.id);

      res.status(200).json({
        success: true,
        message: `Alumno con ID ${req.params.id} eliminado correctamente.`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlumnosController();