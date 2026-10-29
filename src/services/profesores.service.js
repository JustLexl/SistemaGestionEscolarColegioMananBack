const profesoresModel = require('../models/profesores.model');

class ProfesoresService {
  getAllProfesores(filters) {
    return profesoresModel.findAll(filters);
  }

  getProfesorById(id) {
    const profesor = profesoresModel.findById(id);

    if (!profesor) {
      const error = new Error(`El profesor con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    return profesor;
  }

  validarProfesor(data) {
    data = data || {};

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

  createProfesor(data = {}) {
    data = data || {};
    this.validarProfesor(data);

    if (profesoresModel.findByCedula(data.cedula)) {
      const error = new Error('La cédula ya está registrada.');
      error.statusCode = 409;
      throw error;
    }

    return profesoresModel.create({
      nombre: data.nombre,
      cedula: data.cedula
    });
  }

  updateProfesor(id, data = {}) {
    data = data || {};
    const existing = this.getProfesorById(id);
    const updatedData = {
      nombre: data.nombre !== undefined ? data.nombre : existing.nombre,
      cedula: data.cedula !== undefined ? data.cedula : existing.cedula
    };

    this.validarProfesor(updatedData);

    const cedulaExistente = profesoresModel.findByCedula(updatedData.cedula);
    if (cedulaExistente && String(cedulaExistente.id) !== String(id)) {
      const error = new Error('La cédula ya pertenece a otro profesor.');
      error.statusCode = 409;
      throw error;
    }

    return profesoresModel.update(id, updatedData);
  }

  darDeBajaProfesor(id) {
    this.getProfesorById(id);
    return profesoresModel.darDeBaja(id);
  }
}

module.exports = new ProfesoresService();
