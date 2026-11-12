const gradosModel = require('../models/grados.model');
const gruposModel = require('../models/grupos.model');
const ciclosModel = require('../models/ciclos-escolares.model');
const { ESTADOS_CICLO } = require('../utils/ciclo-escolar');

const LIMITES_NIVEL = Object.freeze({ Primaria: 6, Secundaria: 3 });

function crearError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizarNivel(valor) {
  const entrada = String(valor || '').trim().toLowerCase();
  return Object.keys(LIMITES_NIVEL).find(nivel => nivel.toLowerCase() === entrada) || '';
}

class GradosService {
  getAllGrados(filters) {
    return gradosModel.findAll(filters);
  }

  getGradoById(id) {
    const grado = gradosModel.findById(id);
    if (!grado) throw crearError(`El grado con ID ${id} no fue encontrado.`, 404);
    return grado;
  }

  validarGrado(data, existing = null) {
    const nivel = normalizarNivel(data.nivel ?? existing?.nivel);
    const numeroGrado = Number(data.numeroGrado ?? existing?.numeroGrado);
    const cicloEscolarId = Number(data.cicloEscolarId ?? existing?.cicloEscolarId);

    if (!nivel) throw crearError('El nivel debe ser Primaria o Secundaria.', 400);
    if (!Number.isInteger(numeroGrado) || numeroGrado < 1 || numeroGrado > LIMITES_NIVEL[nivel]) {
      throw crearError(
        `El grado de ${nivel} debe estar entre 1 y ${LIMITES_NIVEL[nivel]}.`, 400
      );
    }

    const cicloEscolar = ciclosModel.findById(cicloEscolarId);
    if (!cicloEscolar) {
      throw crearError(`El ciclo escolar con ID ${cicloEscolarId} no fue encontrado.`, 404);
    }

    const duplicado = gradosModel.grados.find(grado =>
      Number(grado.cicloEscolarId) === cicloEscolarId &&
      grado.nivel === nivel &&
      Number(grado.numeroGrado) === numeroGrado &&
      (!existing || String(grado.id) !== String(existing.id))
    );
    if (duplicado) throw crearError('Ya existe ese grado en el ciclo escolar indicado.', 409);

    return {
      nivel,
      numeroGrado,
      nombre: `${numeroGrado}° ${nivel}`,
      cicloEscolarId,
      cicloEscolar
    };
  }

  createGrado(data) {
    const preparado = this.validarGrado(data);
    if (preparado.cicloEscolar.estado !== ESTADOS_CICLO.PLANEACION) {
      throw crearError('Solo se pueden crear grados en ciclos escolares en planeación.', 409);
    }
    const { cicloEscolar, ...persistible } = preparado;
    return gradosModel.create(persistible);
  }

  updateGrado(id, data) {
    const existing = this.getGradoById(id);
    if (existing.cicloEscolar.estado === ESTADOS_CICLO.FINALIZADO) {
      throw crearError('Los grados de un ciclo finalizado son de solo lectura.', 409);
    }
    if (
      existing.cicloEscolar.estado === ESTADOS_CICLO.ACTIVO &&
      data.cicloEscolarId !== undefined &&
      Number(data.cicloEscolarId) !== Number(existing.cicloEscolarId)
    ) {
      throw crearError('No se puede cambiar el ciclo escolar de un grado activo.', 409);
    }

    const preparado = this.validarGrado(data, existing);
    if (
      Number(preparado.cicloEscolarId) !== Number(existing.cicloEscolarId) &&
      preparado.cicloEscolar.estado !== ESTADOS_CICLO.PLANEACION
    ) {
      throw crearError('El grado solo puede moverse a un ciclo en planeación.', 409);
    }
    const tieneGrupos = gruposModel.findAll().some(grupo => String(grupo.gradoId) === String(id));
    if (tieneGrupos && Number(preparado.cicloEscolarId) !== Number(existing.cicloEscolarId)) {
      throw crearError('No se puede cambiar de ciclo un grado que ya tiene grupos.', 409);
    }

    const { cicloEscolar, ...persistible } = preparado;
    return gradosModel.update(id, persistible);
  }

  deleteGrado(id) {
    const existing = this.getGradoById(id);
    if (existing.cicloEscolar.estado !== ESTADOS_CICLO.PLANEACION) {
      throw crearError('Solo se pueden eliminar grados de ciclos en planeación.', 409);
    }
    const tieneGrupos = gruposModel.findAll().some(grupo => String(grupo.gradoId) === String(id));
    if (tieneGrupos) {
      throw crearError('No se puede eliminar un grado que todavía tiene grupos registrados.', 409);
    }
    return gradosModel.delete(id);
  }
}

module.exports = new GradosService();
