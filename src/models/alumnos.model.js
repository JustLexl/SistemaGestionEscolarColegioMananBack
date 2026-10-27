const initialAlumnos = require('../data/alumnos.seed');

/**
 * Modelo de Datos para la entidad Alumnos.
 * Maneja el almacenamiento en memoria y métodos CRUD.
 */
class AlumnosModel {
  constructor() {
    this.alumnos = initialAlumnos.map(alumno => ({ ...alumno }));
  }

  findAll(filters = {}) {
    const { search, grado, grupo, estado } = filters;

    return this.alumnos.filter(alumno => {
      const texto = String(search || '').toLowerCase().trim();

      const matchSearch = !texto ||
        alumno.nombre.toLowerCase().includes(texto) ||
        alumno.matricula.toLowerCase().includes(texto);

      const matchGrado = !grado || alumno.grado === grado;
      const matchGrupo = !grupo || alumno.grupo === grupo;
      const matchEstado = !estado || alumno.estado === estado;

      return matchSearch && matchGrado && matchGrupo && matchEstado;
    });
  }

  findById(id) {
    return this.alumnos.find(
      alumno => String(alumno.id) === String(id)
    ) || null;
  }

  findByMatricula(matricula) {
    return this.alumnos.find(
      alumno => alumno.matricula === matricula
    ) || null;
  }

  create(data) {
    const nextId = this.alumnos.reduce(
      (max, alumno) => Math.max(max, Number(alumno.id)),
      0
    ) + 1;

    const newAlumno = {
      id: nextId,
      matricula: data.matricula.trim(),
      nombre: data.nombre.trim(),
      grado: data.grado.trim(),
      grupo: data.grupo.trim(),
      tutor: data.tutor.trim(),
      estado: data.estado || 'Activo'
    };

    this.alumnos.push(newAlumno);
    return newAlumno;
  }

  update(id, data) {
    const index = this.alumnos.findIndex(
      alumno => String(alumno.id) === String(id)
    );

    if (index === -1) return null;

    this.alumnos[index] = {
      ...this.alumnos[index],
      ...(data.matricula !== undefined && {
        matricula: data.matricula.trim()
      }),
      ...(data.nombre !== undefined && {
        nombre: data.nombre.trim()
      }),
      ...(data.grado !== undefined && {
        grado: data.grado.trim()
      }),
      ...(data.grupo !== undefined && {
        grupo: data.grupo.trim()
      }),
      ...(data.tutor !== undefined && {
        tutor: data.tutor.trim()
      }),
      ...(data.estado !== undefined && {
        estado: data.estado
      })
    };

    return this.alumnos[index];
  }

  delete(id) {
    const index = this.alumnos.findIndex(
      alumno => String(alumno.id) === String(id)
    );

    if (index === -1) return false;

    this.alumnos.splice(index, 1);
    return true;
  }
}

module.exports = new AlumnosModel();