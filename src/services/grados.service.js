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
    const { cicloEscolar, ...persistible } = preparado;
    return gradosModel.create(persistible);
  }

  updateGrado(id, data) {
    const existing = this.getGradoById(id);
    const preparado = this.validarGrado(data, existing);
    const { cicloEscolar, ...persistible } = preparado;
    return gradosModel.update(id, persistible);
  }

  deleteGrado(id) {
    this.getGradoById(id);
    const gruposRelacionados = gruposModel.findAll().filter(grupo => String(grupo.gradoId) === String(id));
    for (const grupo of gruposRelacionados) {
      gruposModel.delete(grupo.id);
    }
    return gradosModel.delete(id);
  }
}

module.exports = new GradosService();
