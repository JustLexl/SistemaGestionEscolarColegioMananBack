const initialMaterias = require('../data/materias.seed');

class MateriasModel {
  constructor() {
    this.materias = initialMaterias.map(materia => ({
      ...materia,
      grupoIds: [...materia.grupoIds]
    }));
  }

  findAll() {
    return this.materias;
  }

  findById(id) {
    return this.materias.find(materia => materia.id === Number(id)) || null;
  }

  findByClaveSep(claveSep, excludeId = null) {
    const clave = String(claveSep || '').trim().toLowerCase();
    return this.materias.find(materia =>
      materia.claveSep.toLowerCase() === clave &&
      (excludeId === null || String(materia.id) !== String(excludeId))
    ) || null;
  }

  findByProfesorId(profesorId) {
    return this.materias.filter(materia =>
      materia.profesorId !== null && String(materia.profesorId) === String(profesorId)
    );
  }

  create(data) {
    const id = this.materias.reduce((max, materia) => Math.max(max, materia.id), 0) + 1;
    const materia = { id, ...data, grupoIds: [...data.grupoIds] };
    this.materias.unshift(materia);
    return materia;
  }

  update(id, data) {
    const index = this.materias.findIndex(materia => materia.id === Number(id));
    if (index === -1) return null;
    this.materias[index] = {
      ...this.materias[index],
      ...data,
      id: Number(id),
      grupoIds: data.grupoIds ? [...data.grupoIds] : this.materias[index].grupoIds
    };
    return this.materias[index];
  }

  delete(id) {
    const index = this.materias.findIndex(materia => materia.id === Number(id));
    if (index === -1) return false;
    this.materias.splice(index, 1);
    return true;
  }

  darDeBaja(id) {
    const materia = this.findById(id);
    if (!materia) return null;
    materia.estado = 'Inactiva';
    return materia;
  }
}

module.exports = new MateriasModel();
