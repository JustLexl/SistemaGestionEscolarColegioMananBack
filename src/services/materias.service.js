const materiasModel = require('../models/materias.model');
const gradosModel = require('../models/grados.model');

const ESTADOS_PERMITIDOS = ['Activa', 'En planeacion', 'Inactiva'];

class MateriasService {
  getAllMaterias(filters) {
    return materiasModel.findAll(filters);
  }

  getMateriaById(id) {
    const materia = materiasModel.findById(id);
    if (!materia) {
      const error = new Error(`La materia con ID ${id} no fue encontrada.`);
      error.statusCode = 404;
      throw error;
    }
    return materia;
  }

  createMateria(data) {
    if (!data.nombre || !data.nombre.trim()) {
      const error = new Error('El nombre de la materia es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    if (data.estado && !ESTADOS_PERMITIDOS.includes(data.estado)) {
      const error = new Error(`El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    // Resolver gradoNombre si no viene explícito
    if (data.gradoId && !data.gradoNombre) {
      const grado = gradosModel.findById(data.gradoId);
      data.gradoNombre = grado ? grado.nombre : `${data.gradoId}° Primaria`;
    }

    return materiasModel.create(data);
  }

  updateMateria(id, data) {
    const existing = materiasModel.findById(id);
    if (!existing) {
      const error = new Error(`La materia con ID ${id} no fue encontrada.`);
      error.statusCode = 404;
      throw error;
    }

    if (data.estado && !ESTADOS_PERMITIDOS.includes(data.estado)) {
      const error = new Error(`El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    if (data.gradoId && !data.gradoNombre) {
      const grado = gradosModel.findById(data.gradoId);
      if (grado) data.gradoNombre = grado.nombre;
    }

    return materiasModel.update(id, data);
  }

  deleteMateria(id) {
    const existing = materiasModel.findById(id);
    if (!existing) {
      const error = new Error(`La materia con ID ${id} no fue encontrada.`);
      error.statusCode = 404;
      throw error;
    }

    return materiasModel.delete(id);
  }

  darDeBajaMateria(id) {
    const existing = materiasModel.findById(id);
    if (!existing) {
      const error = new Error(`La materia con ID ${id} no fue encontrada.`);
      error.statusCode = 404;
      throw error;
    }

    return materiasModel.darDeBaja(id);
  }

  getMateriasMetrics() {
    return materiasModel.getMetrics();
  }
}

module.exports = new MateriasService();
