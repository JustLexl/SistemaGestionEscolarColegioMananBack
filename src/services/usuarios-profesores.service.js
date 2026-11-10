const rolesModel = require('../models/roles.model');
const rolesService = require('./roles.service');
const profesoresService = require('./profesores.service');

class UsuariosProfesoresService {
  crearUsuarioConPerfilSiCorresponde(data = {}) {
    const esProfesor = data.puesto === 'Profesores';
    const siguienteUsuarioId = rolesModel.roles.reduce(
      (max, usuario) => Math.max(max, Number(usuario.id)),
      0
    ) + 1;

    if (esProfesor) {
      profesoresService.validarAltaRelacionada({
        usuarioId: siguienteUsuarioId,
        nombre: data.nombre,
        cedula: data.cedula
      }, false);
    }

    const usuario = rolesService.createRol(data);
    let profesor = null;

    try {
      if (esProfesor) {
        profesor = profesoresService.createProfesor({
          usuarioId: usuario.id,
          nombre: usuario.nombre,
          cedula: data.cedula,
          estado: usuario.estado
        });
      }
    } catch (error) {
      rolesModel.delete(usuario.id);
      throw error;
    }

    return { usuario, profesor };
  }

  actualizarUsuarioYPerfil(id, data = {}) {
    const anterior = { ...rolesService.getRolById(id) };
    const destino = { ...anterior, ...data };
    const existente = profesoresService.getProfesorByUsuarioId(id);

    if (destino.puesto === 'Profesores') {
      if (!existente) {
        profesoresService.validarAltaRelacionada({
          usuarioId: Number(id),
          nombre: destino.nombre,
          cedula: data.cedula
        }, false);
      } else if (data.cedula !== undefined) {
        profesoresService.validarCedulaDisponible(data.cedula, existente.id);
      }
    }

    const usuario = rolesService.updateRol(id, data);
    let profesor = existente;

    try {
      if (usuario.puesto === 'Profesores') {
        profesor = existente
          ? profesoresService.sincronizarDesdeUsuario(usuario, data.cedula)
          : profesoresService.createProfesor({
              usuarioId: usuario.id,
              nombre: usuario.nombre,
              cedula: data.cedula,
              estado: usuario.estado
            });
      } else if (existente) {
        profesor = profesoresService.sincronizarDesdeUsuario(usuario);
      }
    } catch (error) {
      rolesModel.update(id, anterior);
      throw error;
    }

    return { usuario, profesor };
  }

  cambiarEstadoUsuario(id) {
    const usuario = rolesService.toggleRolEstado(id);
    const existente = profesoresService.getProfesorByUsuarioId(id);
    const profesor = existente
      ? profesoresService.sincronizarDesdeUsuario(usuario)
      : null;
    return { usuario, profesor };
  }

  eliminarUsuario(id) {
    const profesor = profesoresService.getProfesorByUsuarioId(id);
    if (profesor) {
      profesoresService.setEstadoProfesor(profesor.id, 'Inactivo');
    }
    rolesService.deleteRol(id);
    return { profesor };
  }
}

module.exports = new UsuariosProfesoresService();
