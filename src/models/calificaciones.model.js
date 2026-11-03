const initialCalificaciones = require('../data/calificaciones.seed');

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase('es-MX');
}

class CalificacionesModel {
  constructor() {
    this.calificaciones = initialCalificaciones.map(calificacion => ({
      ...calificacion
    }));
  }

  findAll(filters = {}) {
    const search = normalize(filters.search);
    const grado = normalize(filters.grado);
    const grupo = normalize(filters.grupo);
    const materia = normalize(filters.materia);
    const periodo = normalize(filters.periodo);

    return this.calificaciones.filter(calificacion => {
      const matchSearch = !search ||
        normalize(calificacion.alumno).includes(search) ||
        normalize(calificacion.matricula).includes(search);
      const matchGrado = !grado || normalize(calificacion.grado) === grado;
      const matchGrupo = !grupo || normalize(calificacion.grupo) === grupo;
      const matchMateria = !materia ||
        normalize(calificacion.materia) === materia;
      const matchPeriodo = !periodo ||
        normalize(calificacion.periodo) === periodo;

      return matchSearch && matchGrado && matchGrupo &&
        matchMateria && matchPeriodo;
    });
  }

  findById(id) {
    return this.calificaciones.find(
      calificacion => String(calificacion.id) === String(id)
    ) || null;
  }

  findDuplicate(data, excludedId = null) {
    return this.calificaciones.find(calificacion =>
      String(calificacion.id) !== String(excludedId) &&
      normalize(calificacion.matricula) === normalize(data.matricula) &&
      normalize(calificacion.materia) === normalize(data.materia) &&
      normalize(calificacion.periodo) === normalize(data.periodo)
    ) || null;
  }

  create(data) {
    const nextNumber = this.calificaciones.reduce((max, calificacion) => {
      const current = Number(String(calificacion.id).replace(/^cal-/, ''));
      return Number.isFinite(current) ? Math.max(max, current) : max;
    }, 0) + 1;

    const newCalificacion = {
      id: `cal-${String(nextNumber).padStart(3, '0')}`,
      ...data
    };

    this.calificaciones.push(newCalificacion);
    return newCalificacion;
  }

  update(id, data) {
    const index = this.calificaciones.findIndex(
      calificacion => String(calificacion.id) === String(id)
    );

    if (index === -1) return null;

    this.calificaciones[index] = {
      id: this.calificaciones[index].id,
      ...data
    };

    return this.calificaciones[index];
  }

  delete(id) {
    const index = this.calificaciones.findIndex(
      calificacion => String(calificacion.id) === String(id)
    );

    if (index === -1) return false;

    this.calificaciones.splice(index, 1);
    return true;
  }
}

module.exports = new CalificacionesModel();
