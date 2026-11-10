const rolesService = require('../services/roles.service');
const usuariosProfesoresService = require('../services/usuarios-profesores.service');

class RolesController {
  getAll(req, res, next) {
    try {
      const filters = {
        searchTerm: req.query.search || req.query.searchTerm,
        estado: req.query.estado,
        puesto: req.query.puesto
      };
      const roles = rolesService.getAllRoles(filters);
      res.status(200).json({ success: true, count: roles.length, data: roles });
    } catch (error) {
      next(error);
    }
  }

  getById(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: rolesService.getRolById(req.params.id)
      });
    } catch (error) {
      next(error);
    }
  }

  create(req, res, next) {
    try {
      const resultado = usuariosProfesoresService
        .crearUsuarioConPerfilSiCorresponde(req.body);
      res.status(201).json({
        success: true,
        message: `Usuario "${resultado.usuario.nombre}" registrado exitosamente`,
        data: resultado.usuario,
        profesor: resultado.profesor
      });
    } catch (error) {
      next(error);
    }
  }

  update(req, res, next) {
    try {
      const resultado = usuariosProfesoresService.actualizarUsuarioYPerfil(
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: `Usuario "${resultado.usuario.nombre}" actualizado exitosamente`,
        data: resultado.usuario,
        profesor: resultado.profesor
      });
    } catch (error) {
      next(error);
    }
  }

  delete(req, res, next) {
    try {
      usuariosProfesoresService.eliminarUsuario(req.params.id);
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
      const resultado = usuariosProfesoresService
        .cambiarEstadoUsuario(req.params.id);
      res.status(200).json({
        success: true,
        message: `Estado de "${resultado.usuario.nombre}" cambiado a ${resultado.usuario.estado}`,
        data: resultado.usuario,
        profesor: resultado.profesor
      });
    } catch (error) {
      next(error);
    }
  }

  getMetrics(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: rolesService.getRolesMetrics()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RolesController();
