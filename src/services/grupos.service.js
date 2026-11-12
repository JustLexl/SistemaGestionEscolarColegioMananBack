const gruposModel = require('../models/grupos.model');
const gradosModel = require('../models/grados.model');
const profesoresModel = require('../models/profesores.model');
const { ESTADOS_CICLO } = require('../utils/ciclo-escolar');

const TURNOS_PERMITIDOS = ['matutino', 'vespertino'];
const ESTADOS_PERMITIDOS = ['Activo', 'Inactivo'];

function crearError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function obtenerIniciales(nombre) {
  const partes = String(nombre || '')
    .replace(/\bProf(?:ra)?\.?\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return partes.slice(0, 2).map(parte => parte[0].toUpperCase()).join('') || 'SA';
}

function resolverLetra(data, existing) {
  const coincidencia = String(data.nombre || '').match(/Grupo\s+([A-Z0-9]+)/i);
  return String(data.grupoLetra ?? coincidencia?.[1] ?? existing?.grupoLetra ?? '')
    .trim().toUpperCase();
}

function normalizarProfesorId(valor) {
  if (valor === null || valor === '' || Number(valor) === 0) return null;
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw crearError('profesorId debe ser un identificador válido o null.', 400);
  }
  return id;
}

class GruposService {
  getAllGrupos(filters) {
    return gruposModel.findAll(filters);
  }

  getGrupoById(id) {
    const grupo = gruposModel.findById(id);
    if (!grupo) throw crearError(`El grupo con ID ${id} no fue encontrado.`, 404);
    return grupo;
  }

  prepararGrupo(data = {}, existing = null) {
    const gradoId = String(data.gradoId ?? existing?.gradoId ?? '').trim();
    if (!gradoId) throw crearError('El gradoId es obligatorio.', 400);

    const grado = gradosModel.findById(gradoId);
    if (!grado) throw crearError(`El grado con ID ${gradoId} no fue encontrado.`, 404);

    const grupoLetra = resolverLetra(data, existing);
    if (!grupoLetra || !/^[A-Z0-9]{1,5}$/.test(grupoLetra)) {
      throw crearError('El grupo debe tener una letra o clave corta válida.', 400);
    }

    const turno = String(data.turno ?? existing?.turno ?? 'matutino').toLowerCase();
    if (!TURNOS_PERMITIDOS.includes(turno)) {
      throw crearError(`El turno debe ser: ${TURNOS_PERMITIDOS.join(' o ')}.`, 400);
    }

    const estadoEntrada = String(data.estado ?? existing?.estado ?? 'Activo');
    const estado = ESTADOS_PERMITIDOS.find(
      permitido => permitido.toLowerCase() === estadoEntrada.toLowerCase()
    );
    if (!estado) throw crearError(`El estado debe ser: ${ESTADOS_PERMITIDOS.join(' o ')}.`, 400);

    const profesorEntrada = Object.prototype.hasOwnProperty.call(data, 'profesorId')
      ? data.profesorId
      : existing?.profesorId ?? null;
    const profesorId = normalizarProfesorId(profesorEntrada);
    let profesor = null;
    if (profesorId !== null) {
      profesor = profesoresModel.findById(profesorId);
      if (!profesor) throw crearError(`El profesor con ID ${profesorId} no fue encontrado.`, 404);
      if (profesor.estado !== 'Activo') {
        throw crearError('El profesor seleccionado está inactivo y no puede asignarse.', 409);
      }
    }

    const alumnosMax = Number(data.alumnosMax ?? existing?.alumnosMax ?? 40);
    const alumnosActuales = Number(data.alumnosActuales ?? existing?.alumnosActuales ?? 0);
    if (!Number.isInteger(alumnosMax) || alumnosMax <= 0) {
      throw crearError('La capacidad máxima debe ser un entero mayor que cero.', 400);
    }
    if (!Number.isInteger(alumnosActuales) || alumnosActuales < 0 || alumnosActuales > alumnosMax) {
      throw crearError('La matrícula actual debe estar entre 0 y la capacidad máxima.', 400);
    }

    const sufijoCiclo = grado.cicloEscolar.nombre.match(/(\d{2})\D*$/)?.[1] || '00';
    const prefijoNivel = grado.nivel === 'Secundaria' ? 'SEC' : 'PRI';
    const clave = String(
      data.clave ?? existing?.clave ??
      `CM-${prefijoNivel}-${grado.numeroGrado}${grupoLetra}-${sufijoCiclo}`
    ).trim().toUpperCase();
    if (!clave) throw crearError('La clave del grupo es obligatoria.', 400);

    return {
      gradoId,
      gradoNombre: grado.nombre,
      grupoLetra,
      nombre: `${grado.nombre} - Grupo ${grupoLetra}`,
      clave,
      aula: String(data.aula ?? existing?.aula ?? 'Aula por asignar').trim(),
      edificio: String(data.edificio ?? existing?.edificio ?? 'Edificio Principal').trim(),
      turno,
      profesorId,
      profesorNombre: profesor?.nombre ?? 'Profesor Sin Asignar',
      profesorIniciales: profesor ? obtenerIniciales(profesor.nombre) : 'SA',
      cedula: profesor?.cedula ?? 'Sin asignar',
      materias: existing?.materias ?? [],
      alumnosActuales,
      alumnosMax,
      estado,
      isBase: data.isBase ?? existing?.isBase ?? false,
      grado
    };
  }

  validarDuplicados(data, excludeId = null) {
    if (gruposModel.findByGradoAndLetra(data.gradoId, data.grupoLetra, excludeId)) {
      throw crearError('Ya existe un grupo con el mismo grado y letra.', 409);
    }
    if (gruposModel.findByClave(data.clave, excludeId)) {
      throw crearError('La clave del grupo ya está registrada.', 409);
    }
  }

  createGrupo(data) {
    const preparado = this.prepararGrupo(data);
    if (preparado.grado.cicloEscolar.estado !== ESTADOS_CICLO.PLANEACION) {
      throw crearError('Solo se pueden crear grupos en grados de ciclos en planeación.', 409);
    }
    this.validarDuplicados(preparado);
    const { grado, ...persistible } = preparado;
    return gruposModel.create(persistible);
  }

  updateGrupo(id, data) {
    const existing = this.getGrupoById(id);
    const estadoCiclo = existing.cicloEscolar.estado;
    if (estadoCiclo === ESTADOS_CICLO.FINALIZADO) {
      throw crearError('Los grupos de un ciclo finalizado son de solo lectura.', 409);
    }
    if (
      estadoCiclo === ESTADOS_CICLO.ACTIVO &&
      data.gradoId !== undefined && String(data.gradoId) !== String(existing.gradoId)
    ) {
      throw crearError('No se puede cambiar el grado ni el ciclo de un grupo activo.', 409);
    }

    const preparado = this.prepararGrupo(data, existing);
    if (
      estadoCiclo === ESTADOS_CICLO.PLANEACION &&
      Number(preparado.grado.cicloEscolarId) !== Number(existing.cicloEscolarId)
    ) {
      throw crearError('Un grupo en planeación solo puede cambiar de grado dentro del mismo ciclo.', 409);
    }
    this.validarDuplicados(preparado, existing.id);
    const { grado, ...persistible } = preparado;
    return gruposModel.update(id, persistible);
  }

  deleteGrupo(id) {
    const existing = this.getGrupoById(id);
    if (existing.cicloEscolar.estado !== ESTADOS_CICLO.PLANEACION) {
      throw crearError('Solo se pueden eliminar grupos de ciclos en planeación.', 409);
    }
    return gruposModel.delete(id);
  }

  toggleGrupoEstado(id) {
    const existing = this.getGrupoById(id);
    if (existing.cicloEscolar.estado === ESTADOS_CICLO.FINALIZADO) {
      throw crearError('Los grupos de un ciclo finalizado son de solo lectura.', 409);
    }
    return gruposModel.toggleEstado(id);
  }

  getGruposMetrics() {
    return gruposModel.getMetrics();
  }
}

module.exports = new GruposService();
