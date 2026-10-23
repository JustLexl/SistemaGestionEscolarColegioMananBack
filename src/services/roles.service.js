const rolesModel = require('../models/roles.model');

const PUESTOS_PERMITIDOS = ['Administrativo', 'Directivos', 'Profesores'];
const ESTADOS_PERMITIDOS = ['Activo', 'Inactivo'];

class RolesService {
  getAllRoles(filters) {
    return rolesModel.findAll(filters);
  }

  getRolById(id) {
    const rol = rolesModel.findById(id);
    if (!rol) {
      const error = new Error(`El rol con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return rol;
  }

  createRol(data) {
    if (!data.nombre || !data.nombre.trim()) {
      const error = new Error('El campo nombre es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    if (!data.puesto || !PUESTOS_PERMITIDOS.includes(data.puesto)) {
      const error = new Error(`El puesto debe ser uno de: ${PUESTOS_PERMITIDOS.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    if (!data.correo || !data.correo.trim()) {
      const error = new Error('El campo correo es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.correo.trim())) {
      const error = new Error('El formato del correo electrónico es inválido.');
      error.statusCode = 400;
      throw error;
    }

    const existing = rolesModel.findByCorreo(data.correo);
    if (existing) {
      const error = new Error(`Ya existe un usuario registrado con el correo ${data.correo}.`);
      error.statusCode = 409;
      throw error;
    }

    if (data.estado && !ESTADOS_PERMITIDOS.includes(data.estado)) {
      const error = new Error(`El estado debe ser: ${ESTADOS_PERMITIDOS.join(' o ')}.`);
      error.statusCode = 400;
      throw error;
    }

    return rolesModel.create(data);
  }

  updateRol(id, data) {
    const existing = rolesModel.findById(id);
    if (!existing) {
      const error = new Error(`El rol con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    if (data.puesto && !PUESTOS_PERMITIDOS.includes(data.puesto)) {
      const error = new Error(`El puesto debe ser uno de: ${PUESTOS_PERMITIDOS.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    if (data.correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.correo.trim())) {
        const error = new Error('El formato del correo electrónico es inválido.');
        error.statusCode = 400;
        throw error;
      }

      const matchCorreo = rolesModel.findByCorreo(data.correo);
      if (matchCorreo && matchCorreo.id !== Number(id)) {
        const error = new Error(`Ya existe otro usuario con el correo ${data.correo}.`);
        error.statusCode = 409;
        throw error;
      }
    }

    if (data.estado && !ESTADOS_PERMITIDOS.includes(data.estado)) {
      const error = new Error(`El estado debe ser: ${ESTADOS_PERMITIDOS.join(' o ')}.`);
      error.statusCode = 400;
      throw error;
    }

    return rolesModel.update(id, data);
  }

  deleteRol(id) {
    const existing = rolesModel.findById(id);
    if (!existing) {
      const error = new Error(`El rol con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return rolesModel.delete(id);
  }

  toggleRolEstado(id) {
    const existing = rolesModel.findById(id);
    if (!existing) {
      const error = new Error(`El rol con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return rolesModel.toggleEstado(id);
  }

  getRolesMetrics() {
    return rolesModel.getMetrics();
  }
}

module.exports = new RolesService();
