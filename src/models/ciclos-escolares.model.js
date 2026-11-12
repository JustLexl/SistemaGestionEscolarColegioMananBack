const initialCiclos = require('../data/ciclos-escolares.seed');
const { determinarEstadoCiclo } = require('../utils/ciclo-escolar');

function serializar(ciclo) {
  if (!ciclo) return null;
  return {
    ...ciclo,
    estado: determinarEstadoCiclo(ciclo.fechaInicio, ciclo.fechaFin)
  };
}

class CiclosEscolaresModel {
  constructor() {
    this.ciclos = initialCiclos.map(ciclo => ({ ...ciclo }));
  }

  findAll() {
    return this.ciclos
      .map(serializar)
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  }

  findById(id) {
    return serializar(this.ciclos.find(ciclo => ciclo.id === Number(id)) || null);
  }

  findRawById(id) {
    return this.ciclos.find(ciclo => ciclo.id === Number(id)) || null;
  }

  create(data) {
    const id = this.ciclos.reduce((max, ciclo) => Math.max(max, ciclo.id), 0) + 1;
    const ciclo = { id, ...data };
    this.ciclos.push(ciclo);
    return serializar(ciclo);
  }

  update(id, data) {
    const index = this.ciclos.findIndex(ciclo => ciclo.id === Number(id));
    if (index === -1) return null;
    this.ciclos[index] = { ...this.ciclos[index], ...data, id: Number(id) };
    return serializar(this.ciclos[index]);
  }
}

module.exports = new CiclosEscolaresModel();
