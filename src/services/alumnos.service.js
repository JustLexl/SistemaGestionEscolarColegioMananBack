const alumnosModel = require('../models/alumnos.model');
const gruposModel = require('../models/grupos.model');

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

  validarCamposAcademicosLegacy(data) {
    for (const campo of ['grado', 'grupo']) {
      if (Object.prototype.hasOwnProperty.call(data, campo)) {
        const error = new Error(
          `El campo ${campo} no establece la asignación académica; utilice grupoId.`
        );
        error.statusCode = 400;
        throw error;
      }
    }
  }

  validarAlumno(data, options = {}) {
    const campos = ['matricula', 'nombre', 'tutor'];

    for (const campo of campos) {
      if (typeof data[campo] !== 'string' || !data[campo].trim()) {
        const error = new Error(`El campo ${campo} es obligatorio.`);
        error.statusCode = 400;
        throw error;
      }
    }

    const fecha = data.fechaNacimiento;

    if (options.permitirFechaLegacyVacia && fecha === '') {
      // Los cinco registros históricos no incluyen esta fecha en el seed original.
    } else if (typeof fecha !== 'string' ||
               !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const error = new Error(
        'La fecha de nacimiento es obligatoria y debe tener el formato AAAA-MM-DD.'
      );
      error.statusCode = 400;
      throw error;
    }

    if (fecha) {
      const fechaNacimiento = new Date(`${fecha}T00:00:00Z`);

      if (
        Number.isNaN(fechaNacimiento.getTime()) ||
        fechaNacimiento.toISOString().slice(0, 10) !== fecha
      ) {
        const error = new Error('La fecha de nacimiento no es válida.');
        error.statusCode = 400;
        throw error;
      }

      const hoy = new Date().toISOString().slice(0, 10);

      if (fecha > hoy) {
        const error = new Error(
          'La fecha de nacimiento no puede ser futura.'
        );
        error.statusCode = 400;
        throw error;
      }
    }

    if (data.estado !== undefined &&
        !['Activo', 'Inactivo'].includes(data.estado)) {
      const error = new Error('El estado debe ser Activo o Inactivo.');
      error.statusCode = 400;
      throw error;
    }
  }

  obtenerGrupoValido(grupoId) {
    if (!Number.isInteger(Number(grupoId)) || Number(grupoId) <= 0) {
      const error = new Error('grupoId debe ser un identificador entero válido.');
      error.statusCode = 400;
      throw error;
    }

    const grupo = gruposModel.findById(Number(grupoId));
    if (!grupo) {
      const error = new Error(`El grupo con ID ${grupoId} no fue encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    if (!grupo.grado || !grupo.cicloEscolar) {
      const error = new Error('El grupo no tiene una relación académica válida.');
      error.statusCode = 409;
      throw error;
    }

    return grupo;
  }

  validarGrupoParaNuevaInscripcion(grupoId) {
    const grupo = this.obtenerGrupoValido(grupoId);

    if (grupo.estado !== 'Activo') {
      const error = new Error('El grupo debe estar Activo para registrar alumnos.');
      error.statusCode = 409;
      throw error;
    }

    if (grupo.cicloEscolar.estado !== 'Activo') {
      const error = new Error(
        'Solo se permiten inscripciones en el ciclo escolar Activo. Preinscripción para ciclos en planeación queda fuera del alcance de Demo 2.3.'
      );
      error.statusCode = 409;
      throw error;
    }

    return grupo;
  }

  createAlumno(data) {
    this.validarCamposAcademicosLegacy(data);
    this.validarAlumno(data);
    this.validarGrupoParaNuevaInscripcion(data.grupoId);

    if (alumnosModel.findByMatricula(data.matricula.trim())) {
      const error = new Error('La matrícula ya está registrada.');
      error.statusCode = 409;
      throw error;
    }

    return alumnosModel.create(data);
  }

  updateAlumno(id, data) {
    const existing = this.getAlumnoById(id);
    this.validarCamposAcademicosLegacy(data);
    const updatedData = { ...existing, ...data };

    this.validarAlumno(updatedData, {
      permitirFechaLegacyVacia:
        existing.fechaNacimiento === '' && updatedData.fechaNacimiento === ''
    });

    const cambioGrupo = data.grupoId !== undefined &&
      Number(data.grupoId) !== Number(existing.grupoId);

    if (cambioGrupo) {
      const grupoActual = this.obtenerGrupoValido(existing.grupoId);

      if (grupoActual.cicloEscolar.estado !== 'Activo') {
        const error = new Error(
          'Este registro pertenece a un ciclo escolar finalizado. La asignación académica se conserva como historial.'
        );
        error.statusCode = 409;
        throw error;
      }

      const grupoNuevo = this.validarGrupoParaNuevaInscripcion(data.grupoId);
      if (grupoNuevo.cicloEscolar.id !== grupoActual.cicloEscolar.id) {
        const error = new Error(
          'La reasignación solo puede realizarse entre grupos del mismo ciclo escolar Activo.'
        );
        error.statusCode = 409;
        throw error;
      }
    } else if (data.grupoId !== undefined) {
      this.obtenerGrupoValido(data.grupoId);
    }

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
