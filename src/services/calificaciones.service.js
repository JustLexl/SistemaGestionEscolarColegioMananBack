const alumnosModel = require('../models/alumnos.model');
const materiasModel = require('../models/materias.model');
const calificacionesModel = require('../models/calificaciones.model');

const PERIODOS_PERMITIDOS = [
  '1er Trimestre',
  '2° Trimestre',
  '3er Trimestre'
];

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase('es-MX');
}

class CalificacionesService {
  getAllCalificaciones(filters) {
    return calificacionesModel.findAll(filters);
  }

  getCalificacionById(id) {
    const calificacion = calificacionesModel.findById(id);

    if (!calificacion) {
      const error = new Error(
        `La calificación con ID ${id} no fue encontrada.`
      );
      error.statusCode = 404;
      throw error;
    }

    return calificacion;
  }

  createCalificacion(data = {}) {
    const normalized = this.buildCalificacion(data || {});
    this.ensureUnique(normalized);

    return calificacionesModel.create(normalized);
  }

  updateCalificacion(id, data = {}) {
    const existing = this.getCalificacionById(id);
    const input = data || {};
    const updatedData = {
      matricula: input.matricula !== undefined
        ? input.matricula
        : existing.matricula,
      materia: input.materia !== undefined
        ? input.materia
        : existing.materia,
      periodo: input.periodo !== undefined
        ? input.periodo
        : existing.periodo,
      calificacion: input.calificacion !== undefined
        ? input.calificacion
        : existing.calificacion
    };
    const normalized = this.buildCalificacion(updatedData);
    this.ensureUnique(normalized, id);

    return calificacionesModel.update(id, normalized);
  }

  deleteCalificacion(id) {
    this.getCalificacionById(id);
    return calificacionesModel.delete(id);
  }

  buildCalificacion(data) {
    const matricula = this.requireText(data.matricula, 'matricula');
    const materiaNombre = this.requireText(data.materia, 'materia');
    const periodoInput = this.requireText(data.periodo, 'periodo');
    const alumno = alumnosModel.findByMatricula(matricula);

    if (!alumno) {
      const error = new Error(
        `No existe un alumno con la matrícula ${matricula}.`
      );
      error.statusCode = 404;
      throw error;
    }

    const materia = materiasModel.findAll().find(item =>
      normalize(item.nombre) === normalize(materiaNombre)
    );

    if (!materia) {
      const error = new Error(
        `No existe la materia ${materiaNombre}.`
      );
      error.statusCode = 404;
      throw error;
    }

    const periodo = PERIODOS_PERMITIDOS.find(item =>
      normalize(item) === normalize(periodoInput)
    );

    if (!periodo) {
      const error = new Error(
        `El periodo debe ser uno de: ${PERIODOS_PERMITIDOS.join(', ')}.`
      );
      error.statusCode = 400;
      throw error;
    }

    this.validateScore(data.calificacion);

    return {
      alumno: alumno.nombre,
      matricula: alumno.matricula,
      grado: alumno.grado.replace(/\s+Primaria$/i, '').trim(),
      grupo: alumno.grupo.replace(/^Grupo\s+/i, '').trim(),
      materia: materia.nombre,
      periodo,
      calificacion: data.calificacion
    };
  }

  requireText(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
      const error = new Error(`El campo ${field} es obligatorio.`);
      error.statusCode = 400;
      throw error;
    }

    return value.trim();
  }

  validateScore(value) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 10 ||
      !Number.isInteger(value * 10)
    ) {
      const error = new Error(
        'La calificación debe ser un número entre 0 y 10 con máximo un decimal.'
      );
      error.statusCode = 400;
      throw error;
    }
  }

  ensureUnique(data, excludedId = null) {
    if (calificacionesModel.findDuplicate(data, excludedId)) {
      const error = new Error(
        'Ya existe una calificación para esta matrícula, materia y periodo.'
      );
      error.statusCode = 409;
      throw error;
    }
  }
}

module.exports = new CalificacionesService();
