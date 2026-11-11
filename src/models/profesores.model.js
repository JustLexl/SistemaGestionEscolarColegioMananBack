const initialProfesores = require('../data/profesores.seed');

class ProfesoresModel {
  constructor() {
    this.profesores = initialProfesores.map(profesor => {
      const { materias, grupos, ...datosBase } = profesor;
      return {
        ...datosBase,
        usuarioId: profesor.usuarioId ?? null
      };
    });
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
    const normalizada = String(cedula || '').trim().toLowerCase();
    return this.profesores.find(
      profesor => profesor.cedula.trim().toLowerCase() === normalizada
    ) || null;
  }

  findByUsuarioId(usuarioId) {
    if (usuarioId === null || usuarioId === undefined) return null;
    return this.profesores.find(
      profesor => String(profesor.usuarioId) === String(usuarioId)
    ) || null;
  }

  create(data) {
    const nextId = this.profesores.reduce(
      (max, profesor) => Math.max(max, Number(profesor.id)),
      0
    ) + 1;

    const newProfesor = {
      id: nextId,
      usuarioId: Number(data.usuarioId),
      nombre: data.nombre.trim(),
      cedula: data.cedula.trim(),
      estado: data.estado || 'Activo'
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

  setEstado(id, estado) {
    const profesor = this.findById(id);
    if (!profesor) return null;
    profesor.estado = estado;
    return profesor;
  }

  darDeBaja(id) {
    return this.setEstado(id, 'Inactivo');
  }

  delete(id) {
    const index = this.profesores.findIndex(
      profesor => String(profesor.id) === String(id)
    );
    if (index === -1) return false;
    this.profesores.splice(index, 1);
    return true;
  }
}

module.exports = new ProfesoresModel();
