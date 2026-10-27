const asistenciasModel = require('../models/asistencias.model');

class AsistenciasService {

  getAllAsistencias() {
    return asistenciasModel.findAll();
  }

  getAsistenciaById(id) {
    const asistencia = asistenciasModel.findById(id);

    if (!asistencia) {
      const error = new Error(`La asistencia con ID ${id} no fue encontrada.`);
      error.status = 404;
      throw error;
    }

    return asistencia;
  }

  getAsistenciasByAlumnoId(alumnoId) {
    return asistenciasModel.findByAlumnoId(alumnoId);
  }

  validarAsistencia(data) {
    if (!Number.isInteger(Number(data.alumnoId)) ||
        Number(data.alumnoId) <= 0) {
      const error = new Error('El ID del alumno debe ser válido.');
      error.status = 400;
      throw error;
    }

    if (typeof data.fecha !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha) ||
        Number.isNaN(Date.parse(data.fecha))) {
      const error = new Error('La fecha debe tener el formato YYYY-MM-DD y ser válida.');
      error.status = 400;
      throw error;
    }

    const estadosValidos = ['Presente', 'Ausente', 'Justificada'];

    if (!estadosValidos.includes(data.estado)) {
      const error = new Error(
        'El estado debe ser Presente, Ausente o Justificada.'
      );
      error.status = 400;
      throw error;
    }
  }

  createAsistencia(data) {
    this.validarAsistencia(data);
    return asistenciasModel.create(data);
  }

  updateAsistencia(id, data) {
    const asistencia = this.getAsistenciaById(id);

    const datosActualizados = {
      ...asistencia,
      ...data,
      alumnoId: asistencia.alumnoId
    };

    this.validarAsistencia(datosActualizados);

    return asistenciasModel.update(id, datosActualizados);
  }

  deleteAsistencia(id) {
    this.getAsistenciaById(id);
    return asistenciasModel.delete(id);
  }
}

module.exports = new AsistenciasService();