const initialProfesores = require('../data/profesores.seed');

/**
 * Modelo de Datos para la entidad Profesores.
 * Maneja el almacenamiento en memoria y métodos CRUD.
 */
class ProfesoresModel {
  constructor() {
    this.profesores = initialProfesores.map(profesor => ({
      ...profesor,
      materias: [...profesor.materias],
      grupos: [...profesor.grupos]
    }));
  }

  findAll(filters = {}) {
    const { search, estado } = filters;
    const texto = String(search || '').trim().toLowerCase();

    return this.profesores.filter(profesor => {
      const matchSearch = !texto ||
        profesor.nombre.toLowerCase().includes(texto) ||
        profesor.cedula.toLowerCase().includes(texto);
      const matchEstado = !estado ||
        profesor.estado.toLowerCase() === String(estado).toLowerCase();

      return matchSearch && matchEstado;
    });
  }

  findById(id) {
    return this.profesores.find(
      profesor => String(profesor.id) === String(id)
    ) || null;
  }

  findByCedula(cedula) {
    const cedulaNormalizada = String(cedula || '').trim().toLowerCase();
    return this.profesores.find(
      profesor => profesor.cedula.trim().toLowerCase() === cedulaNormalizada
    ) || null;
  }

  create(data) {
    const nextId = this.profesores.reduce(
      (max, profesor) => Math.max(max, Number(profesor.id)),
      0
    ) + 1;

    const newProfesor = {
      id: nextId,
      nombre: data.nombre.trim(),
      cedula: data.cedula.trim(),
      materias: [],
      grupos: [],
      estado: 'Activo'
    };

    this.profesores.unshift(newProfesor);
    return newProfesor;
  }

  update(id, data) {
    const index = this.profesores.findIndex(
      profesor => String(profesor.id) === String(id)
    );

    if (index === -1) return null;

    this.profesores[index] = {
      ...this.profesores[index],
      nombre: data.nombre.trim(),
      cedula: data.cedula.trim()
    };

    return this.profesores[index];
  }

  darDeBaja(id) {
    const profesor = this.findById(id);
    if (!profesor) return null;

    profesor.estado = 'Inactivo';
    return profesor;
  }
}

module.exports = new ProfesoresModel();
