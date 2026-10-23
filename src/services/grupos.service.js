const gruposModel = require('../models/grupos.model');
const gradosModel = require('../models/grados.model');

const TURNOS_PERMITIDOS = ['matutino', 'vespertino'];
const ESTADOS_PERMITIDOS = ['Activo', 'Inactivo'];

class GruposService {
  getAllGrupos(filters) {
    return gruposModel.findAll(filters);
  }

  getGrupoById(id) {
    const grupo = gruposModel.findById(id);
    if (!grupo) {
      const error = new Error(`El grupo con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return grupo;
  }

  createGrupo(data) {
    if (!data.gradoId) {
      const error = new Error('El gradoId es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    if (data.turno && !TURNOS_PERMITIDOS.includes(data.turno.toLowerCase())) {
      const error = new Error(`El turno debe ser: ${TURNOS_PERMITIDOS.join(' o ')}.`);
      error.statusCode = 400;
      throw error;
    }

    if (data.estado && !ESTADOS_PERMITIDOS.includes(data.estado)) {
      const error = new Error(`El estado debe ser: ${ESTADOS_PERMITIDOS.join(' o ')}.`);
      error.statusCode = 400;
      throw error;
    }

    // Resolver gradoNombre si no viene explícito
    if (!data.gradoNombre) {
      const grado = gradosModel.findById(data.gradoId);
      data.gradoNombre = grado ? grado.nombre : `${data.gradoId}° Grado`;
    }

    return gruposModel.create(data);
  }

  updateGrupo(id, data) {
    const existing = gruposModel.findById(id);
    if (!existing) {
      const error = new Error(`El grupo con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    if (data.turno && !TURNOS_PERMITIDOS.includes(data.turno.toLowerCase())) {
      const error = new Error(`El turno debe ser: ${TURNOS_PERMITIDOS.join(' o ')}.`);
      error.statusCode = 400;
      throw error;
    }

    if (data.estado && !ESTADOS_PERMITIDOS.includes(data.estado)) {
      const error = new Error(`El estado debe ser: ${ESTADOS_PERMITIDOS.join(' o ')}.`);
      error.statusCode = 400;
      throw error;
    }

    if (data.gradoId && !data.gradoNombre) {
      const grado = gradosModel.findById(data.gradoId);
      if (grado) data.gradoNombre = grado.nombre;
    }

    return gruposModel.update(id, data);
  }

  deleteGrupo(id) {
    const existing = gruposModel.findById(id);
    if (!existing) {
      const error = new Error(`El grupo con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    return gruposModel.delete(id);
  }

  toggleGrupoEstado(id) {
    const existing = gruposModel.findById(id);
    if (!existing) {
      const error = new Error(`El grupo con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    return gruposModel.toggleEstado(id);
  }

  getGruposMetrics() {
    return gruposModel.getMetrics();
  }
}

module.exports = new GruposService();
