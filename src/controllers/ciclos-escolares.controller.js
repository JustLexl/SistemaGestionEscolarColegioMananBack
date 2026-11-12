const ciclosService = require('../services/ciclos-escolares.service');

class CiclosEscolaresController {
  getAll(req, res, next) {
    try {
      const ciclos = ciclosService.getAll();
      res.status(200).json({ success: true, count: ciclos.length, data: ciclos });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      res.status(200).json({ success: true, data: ciclosService.getById(req.params.id) });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const ciclo = ciclosService.create(req.body);
      res.status(201).json({
        success: true,
        message: `Ciclo escolar "${ciclo.nombre}" creado exitosamente`,
        data: ciclo
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const ciclo = ciclosService.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: `Ciclo escolar "${ciclo.nombre}" actualizado exitosamente`,
        data: ciclo
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CiclosEscolaresController();
