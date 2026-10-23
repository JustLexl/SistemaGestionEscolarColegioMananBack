const initialGrados = require('../data/grados.seed');

/**
 * Modelo de Datos para la tabla / entidad Grados.
 * Maneja el almacenamiento en memoria y métodos CRUD.
 */
class GradosModel {
  constructor() {
    this.grados = [...initialGrados];
  }

  findAll(filters = {}) {
    const { nivel, ciclo } = filters;
    return this.grados.filter(grado => {
      const matchNivel = !nivel || grado.nivel.toLowerCase() === nivel.toLowerCase();
      const matchCiclo = !ciclo || grado.ciclo.toLowerCase() === ciclo.toLowerCase();
      return matchNivel && matchCiclo;
    });
  }

  findById(id) {
    const stringId = String(id);
    return this.grados.find(g => String(g.id) === stringId) || null;
  }

  create(data) {
    const nextId = (this.grados.length + 1).toString();
    const newGrado = {
      id: data.id ? String(data.id) : nextId,
      nombre: data.nombre.trim(),
      nivel: data.nivel ? data.nivel.charAt(0).toUpperCase() + data.nivel.slice(1) : 'Primaria',
      ciclo: data.ciclo || '2024–2025'
    };
    this.grados.push(newGrado);
    return newGrado;
  }

  update(id, data) {
    const stringId = String(id);
    const index = this.grados.findIndex(g => String(g.id) === stringId);
    if (index === -1) return null;

    this.grados[index] = {
      ...this.grados[index],
      ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
      ...(data.nivel !== undefined && { nivel: data.nivel.trim() }),
      ...(data.ciclo !== undefined && { ciclo: data.ciclo.trim() })
    };
    return this.grados[index];
  }

  delete(id) {
    const stringId = String(id);
    const index = this.grados.findIndex(g => String(g.id) === stringId);
    if (index === -1) return false;
    this.grados.splice(index, 1);
    return true;
  }
}

module.exports = new GradosModel();
