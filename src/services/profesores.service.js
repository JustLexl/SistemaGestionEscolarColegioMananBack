const profesoresModel = require('../models/profesores.model');
const rolesModel = require('../models/roles.model');
const gruposModel = require('../models/grupos.model');
const materiasModel = require('../models/materias.model');

class ProfesoresService {
  getAllProfesores(filters) {
    return profesoresModel.findAll(filters).map(
      profesor => this.enriquecerProfesor(profesor)
    );
  }

  getProfesorById(id) {
    const profesor = profesoresModel.findById(id);
    if (!profesor) {
      const error = new Error(`El profesor con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return this.enriquecerProfesor(profesor);
  }

  getProfesorByUsuarioId(usuarioId) {
    const profesor = profesoresModel.findByUsuarioId(usuarioId);
    return profesor ? this.enriquecerProfesor(profesor) : null;
  }

  enriquecerProfesor(profesor) {
    const grupos = gruposModel.findByProfesorId(profesor.id).map(grupo => {
      const gradoCorto = String(grupo.gradoNombre || '')
        .replace(/\s+(Primaria|Grado)$/i, '')
        .trim();
      return `${gradoCorto} ${grupo.grupoLetra}`.trim();
    });
    const materias = materiasModel.findByProfesorId(profesor.id).map(
      materia => materia.nombre
    );

    return {
      ...profesor,
      grupos,
      materias
    };
  }

  validarProfesor(data = {}) {
    if (typeof data.nombre !== 'string' || !data.nombre.trim()) {
      const error = new Error('El campo nombre es obligatorio.');
      error.statusCode = 400;
      throw error;
    }
    if (typeof data.cedula !== 'string' || !data.cedula.trim()) {
      const error = new Error('El campo cedula es obligatorio.');
      error.statusCode = 400;
      throw error;
    }
  }

  validarCedulaDisponible(cedula, profesorId = null) {
    if (typeof cedula !== 'string' || !cedula.trim()) {
      const error = new Error('El campo cedula es obligatorio.');
      error.statusCode = 400;
      throw error;
    }
    const existente = profesoresModel.findByCedula(cedula);
    if (existente && String(existente.id) !== String(profesorId)) {
      const error = new Error('La cédula ya está registrada.');
      error.statusCode = 409;
      throw error;
    }
  }

  validarAltaRelacionada(data = {}, validarUsuario = true) {
    this.validarProfesor(data);
    if (!Number.isInteger(Number(data.usuarioId)) || Number(data.usuarioId) <= 0) {
      const error = new Error('El campo usuarioId es obligatorio para profesores nuevos.');
      error.statusCode = 400;
      throw error;
    }
    if (profesoresModel.findByUsuarioId(data.usuarioId)) {
      const error = new Error('El usuario ya tiene un perfil Profesor relacionado.');
      error.statusCode = 409;
      throw error;
    }
    if (validarUsuario) {
      const usuario = rolesModel.findById(data.usuarioId);
      if (!usuario || usuario.puesto !== 'Profesores') {
        const error = new Error('usuarioId debe corresponder a un usuario con rol Profesores.');
        error.statusCode = 400;
        throw error;
      }
    }
    this.validarCedulaDisponible(data.cedula);
  }

  createProfesor(data = {}) {
    this.validarAltaRelacionada(data, true);
    return this.enriquecerProfesor(profesoresModel.create({
      usuarioId: data.usuarioId,
      nombre: data.nombre,
      cedula: data.cedula,
      estado: data.estado || 'Activo'
    }));
  }

  updateProfesor(id, data = {}) {
    const existing = this.getProfesorById(id);
    const updatedData = {
      nombre: data.nombre !== undefined ? data.nombre : existing.nombre,
      cedula: data.cedula !== undefined ? data.cedula : existing.cedula
    };
    this.validarProfesor(updatedData);
    this.validarCedulaDisponible(updatedData.cedula, existing.id);
    return this.enriquecerProfesor(profesoresModel.update(id, updatedData));
  }

  darDeBajaProfesor(id) {
    this.getProfesorById(id);
    return this.enriquecerProfesor(profesoresModel.darDeBaja(id));
  }

  sincronizarDesdeUsuario(usuario, cedula) {
    const profesor = profesoresModel.findByUsuarioId(usuario.id);
    if (!profesor) return null;
    const updatedData = {
      nombre: usuario.nombre,
      cedula: cedula !== undefined ? cedula : profesor.cedula
    };
    this.validarProfesor(updatedData);
    this.validarCedulaDisponible(updatedData.cedula, profesor.id);
    profesoresModel.update(profesor.id, updatedData);
    return this.enriquecerProfesor(profesoresModel.setEstado(
      profesor.id,
      usuario.puesto === 'Profesores' && usuario.estado === 'Activo'
        ? 'Activo'
        : 'Inactivo'
    ));
  }

  setEstadoProfesor(id, estado) {
    const profesor = profesoresModel.setEstado(id, estado);
    return profesor ? this.enriquecerProfesor(profesor) : null;
  }

  eliminarProfesorInterno(id) {
    return profesoresModel.delete(id);
  }
}

module.exports = new ProfesoresService();
