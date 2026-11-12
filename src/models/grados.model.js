const initialGrados = require('../data/grados.seed');
const ciclosModel = require('./ciclos-escolares.model');

function serializar(grado) {
  if (!grado) return null;
  const cicloEscolar = ciclosModel.findById(grado.cicloEscolarId);
  return {
    ...grado,
    ciclo: cicloEscolar?.nombre || '',
    cicloEscolar
  };
}

class GradosModel {
  constructor() {
    this.grados = initialGrados.map(grado => ({ ...grado }));
  }

  findAll(filters = {}) {
    const { nivel, ciclo, cicloEscolarId } = filters;
    return this.grados
      .filter(grado => {
        const cicloRelacionado = ciclosModel.findById(grado.cicloEscolarId);
        const matchNivel = !nivel || grado.nivel.toLowerCase() === nivel.toLowerCase();
        const matchCiclo = !ciclo || cicloRelacionado?.nombre.toLowerCase() === ciclo.toLowerCase();
        const matchCicloId = !cicloEscolarId ||
          Number(grado.cicloEscolarId) === Number(cicloEscolarId);
        return matchNivel && matchCiclo && matchCicloId;
      })
      .map(serializar);
  }

  findById(id) {
    return serializar(this.grados.find(grado => String(grado.id) === String(id)) || null);
  }

  findRawById(id) {
    return this.grados.find(grado => String(grado.id) === String(id)) || null;
  }

  create(data) {
    const nextId = (this.grados.reduce(
      (max, grado) => Math.max(max, Number(grado.id) || 0), 0
    ) + 1).toString();
    const newGrado = { id: nextId, ...data };
    this.grados.push(newGrado);
    return serializar(newGrado);
  }

  update(id, data) {
    const index = this.grados.findIndex(grado => String(grado.id) === String(id));
    if (index === -1) return null;
    this.grados[index] = { ...this.grados[index], ...data, id: String(id) };
    return serializar(this.grados[index]);
  }

  delete(id) {
    const index = this.grados.findIndex(grado => String(grado.id) === String(id));
    if (index === -1) return false;
    this.grados.splice(index, 1);
    return true;
  }
}

module.exports = new GradosModel();
