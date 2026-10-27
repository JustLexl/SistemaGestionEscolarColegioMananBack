const initialAsistencias = require('../data/asistencias.seed');

class AsistenciasModel {
  constructor() {
    this.asistencias = initialAsistencias.map(
      asistencia => ({ ...asistencia })
    );
  }

  findAll() {
    return this.asistencias;
  }

  findById(id) {
    return this.asistencias.find(
      asistencia => asistencia.id === Number(id)
    );
  }

  findByAlumnoId(alumnoId) {
    return this.asistencias
      .filter(asistencia => asistencia.alumnoId === Number(alumnoId))
      .sort((a, b) =>
        b.fecha.localeCompare(a.fecha) || b.id - a.id
      );
  }

  create(data) {
    const nuevoId = this.asistencias.length
      ? Math.max(...this.asistencias.map(a => a.id)) + 1
      : 1;

    const nuevaAsistencia = {
      id: nuevoId,
      alumnoId: Number(data.alumnoId),
      fecha: data.fecha,
      estado: data.estado
    };

    this.asistencias.push(nuevaAsistencia);
    return nuevaAsistencia;
  }

  update(id, data) {
    const asistencia = this.findById(id);

    if (!asistencia) {
      return null;
    }

    if (data.fecha !== undefined) {
      asistencia.fecha = data.fecha;
    }

    if (data.estado !== undefined) {
      asistencia.estado = data.estado;
    }

    return asistencia;
  }

  delete(id) {
    const index = this.asistencias.findIndex(
      asistencia => asistencia.id === Number(id)
    );

    if (index === -1) {
      return null;
    }

    const [eliminada] = this.asistencias.splice(index, 1);
    return eliminada;
  }
}

module.exports = new AsistenciasModel();