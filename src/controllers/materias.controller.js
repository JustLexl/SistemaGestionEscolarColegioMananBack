const materiasService = require('../services/materias.service');

class MateriasController {
  getAll(req, res, next) {
    try {
      const filters = {
        searchTerm: req.query.search || req.query.searchTerm,
        gradoId: req.query.gradoId,
        grupo: req.query.grupo,
        estado: req.query.estado
      };
      const materias = materiasService.getAllMaterias(filters);
      res.status(200).json({
        success: true,
        count: materias.length,
        data: materias
      });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      const materia = materiasService.getMateriaById(req.params.id);
      res.status(200).json({
        success: true,
        data: materia
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const newMateria = materiasService.createMateria(req.body);
      res.status(201).json({
        success: true,
        message: `Materia "${newMateria.nombre}" registrada exitosamente en el catálogo`,
        data: newMateria
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const updated = materiasService.updateMateria(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: `Materia "${updated.nombre}" actualizada exitosamente`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  delete(req, res, next) {
    try {
      materiasService.deleteMateria(req.params.id);
      res.status(200).json({
        success: true,
        message: `Materia con ID ${req.params.id} eliminada correctamente`
      });
    } catch (error) {
      next(error);
    }
  }

  darDeBaja(req, res, next) {
    try {
      const materia = materiasService.darDeBajaMateria(req.params.id);
      res.status(200).json({
        success: true,
        message: `Materia "${materia.nombre}" dada de baja del plan escolar`,
        data: materia
      });
    } catch (error) {
      next(error);
    }
  }

  getMetrics(req, res, next) {
    try {
      const metrics = materiasService.getMateriasMetrics();
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MateriasController();
