const ciclosModel = require('../models/ciclos-escolares.model');
const {
  ESTADOS_CICLO,
  determinarEstadoCiclo,
  esFechaISO,
  seSolapan
} = require('../utils/ciclo-escolar');

function crearError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class CiclosEscolaresService {
  getAll() {
    return ciclosModel.findAll();
  }

  getById(id) {
    const ciclo = ciclosModel.findById(id);
    if (!ciclo) throw crearError(`El ciclo escolar con ID ${id} no fue encontrado.`, 404);
    return ciclo;
  }

  validar(data, existing = null) {
    const ciclo = {
      nombre: String(data.nombre ?? existing?.nombre ?? '').trim(),
      fechaInicio: String(data.fechaInicio ?? existing?.fechaInicio ?? '').trim(),
      fechaFin: String(data.fechaFin ?? existing?.fechaFin ?? '').trim()
    };

    if (!ciclo.nombre) throw crearError('El nombre del ciclo escolar es obligatorio.', 400);
    if (!esFechaISO(ciclo.fechaInicio) || !esFechaISO(ciclo.fechaFin)) {
      throw crearError('Las fechas deben utilizar el formato AAAA-MM-DD.', 400);
    }
    if (ciclo.fechaInicio >= ciclo.fechaFin) {
      throw crearError('La fecha de inicio debe ser anterior a la fecha de fin.', 400);
    }

    const otros = ciclosModel.ciclos.filter(
      item => !existing || item.id !== Number(existing.id)
    );
    if (otros.some(item => item.nombre.toLowerCase() === ciclo.nombre.toLowerCase())) {
      throw crearError('Ya existe un ciclo escolar con ese nombre.', 409);
    }
    if (otros.some(item => seSolapan(
      ciclo.fechaInicio,
      ciclo.fechaFin,
      item.fechaInicio,
      item.fechaFin
    ))) {
      throw crearError('Las fechas del ciclo escolar se solapan con otro ciclo registrado.', 409);
    }

    const estado = determinarEstadoCiclo(ciclo.fechaInicio, ciclo.fechaFin);
    if (estado === ESTADOS_CICLO.ACTIVO) {
      const activo = otros.find(item =>
        determinarEstadoCiclo(item.fechaInicio, item.fechaFin) === ESTADOS_CICLO.ACTIVO
      );
      if (activo) {
        throw crearError('Solo puede existir un ciclo escolar activo al mismo tiempo.', 409);
      }
    }
    return ciclo;
  }

  create(data) {
    return ciclosModel.create(this.validar(data));
  }

  update(id, data) {
    const existing = this.getById(id);
    if (existing.estado !== ESTADOS_CICLO.PLANEACION) {
      throw crearError(
        'Este ciclo escolar ya inició o finalizó. Su nombre y sus fechas no pueden modificarse.',
        409
      );
    }
    return ciclosModel.update(id, this.validar(data, existing));
  }
}

module.exports = new CiclosEscolaresService();
