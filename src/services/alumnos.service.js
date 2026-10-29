const alumnosModel = require('../models/alumnos.model');

class AlumnosService {
  getAllAlumnos(filters) {
    return alumnosModel.findAll(filters);
  }

  getAlumnoById(id) {
    const alumno = alumnosModel.findById(id);

    if (!alumno) {
      const error = new Error(`El alumno con ID ${id} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    return alumno;
  }

  validarAlumno(data) {
    const campos = ['matricula', 'nombre', 'grado', 'grupo', 'tutor'];

    for (const campo of campos) {
      if (typeof data[campo] !== 'string' || !data[campo].trim()) {
        const error = new Error(`El campo ${campo} es obligatorio.`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Validar fecha de nacimiento obligatoria
    const fecha = data.fechaNacimiento;

    if (typeof fecha !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const error = new Error(
        'La fecha de nacimiento es obligatoria y debe tener el formato AAAA-MM-DD.'
      );
      error.statusCode = 400;
      throw error;
    }

    // Comprobar que la fecha realmente exista
    const fechaNacimiento = new Date(`${fecha}T00:00:00Z`);

    if (
      Number.isNaN(fechaNacimiento.getTime()) ||
      fechaNacimiento.toISOString().slice(0, 10) !== fecha
    ) {
      const error = new Error('La fecha de nacimiento no es válida.');
      error.statusCode = 400;
      throw error;
    }

    // No permitir fechas futuras
    const hoy = new Date().toISOString().slice(0, 10);

    if (fecha > hoy) {
      const error = new Error(
        'La fecha de nacimiento no puede ser futura.'
      );
      error.statusCode = 400;
      throw error;
    }

    if (data.estado !== undefined &&
        !['Activo', 'Inactivo'].includes(data.estado)) {
      const error = new Error('El estado debe ser Activo o Inactivo.');
      error.statusCode = 400;
      throw error;
    }
  }

  createAlumno(data) {
    this.validarAlumno(data);

    if (alumnosModel.findByMatricula(data.matricula.trim())) {
      const error = new Error('La matrícula ya está registrada.');
      error.statusCode = 409;
      throw error;
    }

    return alumnosModel.create(data);
  }

  updateAlumno(id, data) {
    const existing = this.getAlumnoById(id);
    const updatedData = { ...existing, ...data };

    this.validarAlumno(updatedData);

    const matriculaExistente = alumnosModel.findByMatricula(
      updatedData.matricula.trim()
    );

    if (matriculaExistente &&
        String(matriculaExistente.id) !== String(id)) {
      const error = new Error('La matrícula ya pertenece a otro alumno.');
      error.statusCode = 409;
      throw error;
    }

    return alumnosModel.update(id, data);
  }

  darDeBajaAlumno(id) {
    this.getAlumnoById(id);

    return alumnosModel.update(id, { estado: 'Inactivo' });
  }

  deleteAlumno(id) {
    this.getAlumnoById(id);

    return alumnosModel.delete(id);
  }
}

module.exports = new AlumnosService();
