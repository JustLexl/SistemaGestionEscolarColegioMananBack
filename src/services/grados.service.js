const gradosModel = require('../models/grados.model');

class GradosService {
  getAllGrados(filters) {
    return gradosModel.findAll(filters);
  }

  getGradoById(id) {
    const grado = gradosModel.findById(id);
    if (!grado) {
      const error = new Error(`El grado con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return grado;
  }

  createGrado(data) {
    if (!data.nombre || !data.nombre.trim()) {
      const error = new Error('El nombre del grado es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    return gradosModel.create(data);
  }

  updateGrado(id, data) {
    const existing = gradosModel.findById(id);
    if (!existing) {
      const error = new Error(`El grado con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    return gradosModel.update(id, data);
  }

  deleteGrado(id) {
    const existing = gradosModel.findById(id);
    if (!existing) {
      const error = new Error(`El grado con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    return gradosModel.delete(id);
  }
}

module.exports = new GradosService();
