const materiasModel = require('../models/materias.model');
const gruposModel = require('../models/grupos.model');
const profesoresModel = require('../models/profesores.model');
const { ESTADOS_CICLO } = require('../utils/ciclo-escolar');

const ESTADOS_MATERIA = Object.freeze({
  ACTIVA: 'Activa',
  PLANEACION: 'En planeacion',
  INACTIVA: 'Inactiva'
});
const ESTADOS_PERMITIDOS = Object.freeze(Object.values(ESTADOS_MATERIA));

function crearError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizarEstado(valor, fallback = ESTADOS_MATERIA.ACTIVA) {
  const entrada = String(valor ?? fallback)
    .trim()
    .toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const estado = ESTADOS_PERMITIDOS.find(permitido =>
    permitido.toLocaleLowerCase('es-MX') === entrada
  );
  if (!estado) {
    throw crearError(`El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.`, 400);
  }
  return estado;
}

function normalizarGrupoIds(valor) {
  if (!Array.isArray(valor)) {
    throw crearError('grupoIds debe ser un arreglo de identificadores.', 400);
  }
  if (valor.length === 0) {
    throw crearError('La materia debe pertenecer al menos a un grupo.', 400);
  }
  const ids = valor.map(id => Number(id));
  if (ids.some(id => !Number.isInteger(id) || id <= 0)) {
    throw crearError('Cada grupoId debe ser un identificador entero válido.', 400);
  }
  if (new Set(ids).size !== ids.length) {
    throw crearError('grupoIds no puede contener grupos duplicados.', 400);
  }
  return ids;
}

function normalizarProfesorId(valor) {
  if (valor === null || valor === '' || valor === undefined) return null;
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw crearError('profesorId debe ser un identificador entero válido o null.', 400);
  }
  return id;
}

function mismasRelaciones(actuales, nuevas) {
  if (actuales.length !== nuevas.length) return false;
  const conjunto = new Set(actuales.map(Number));
  return nuevas.every(id => conjunto.has(Number(id)));
}

class MateriasService {
  serializarMateria(materia) {
    if (!materia) return null;
    const grupos = materia.grupoIds
      .map(id => gruposModel.findById(id))
      .filter(Boolean);
    const gradosMap = new Map();
    for (const grupo of grupos) {
      if (grupo.grado) {
        gradosMap.set(String(grupo.grado.id), {
          id: String(grupo.grado.id),
          nombre: grupo.grado.nombre,
          nivel: grupo.grado.nivel,
          numeroGrado: grupo.grado.numeroGrado
        });
      }
    }
    const profesor = materia.profesorId === null
      ? null
      : profesoresModel.findById(materia.profesorId);
    const cicloEscolar = grupos[0]?.cicloEscolar || null;

    return {
      ...materia,
      grupoIds: [...materia.grupoIds],
      grupos: grupos.map(grupo => ({
        id: grupo.id,
        nombre: grupo.nombre,
        grupoLetra: grupo.grupoLetra,
        gradoId: String(grupo.gradoId),
        gradoNombre: grupo.grado?.nombre || grupo.gradoNombre
      })),
      grados: [...gradosMap.values()],
      cicloEscolar,
      profesor: profesor ? {
        id: profesor.id,
        nombre: profesor.nombre,
        cedula: profesor.cedula,
        estado: profesor.estado
      } : null,
      gruposCount: grupos.length
    };
  }

  getAllMaterias(filters = {}) {
    const search = String(filters.searchTerm || filters.search || '').trim().toLowerCase();
    return materiasModel.findAll()
      .map(materia => this.serializarMateria(materia))
      .filter(materia => {
        const matchSearch = !search || [
          materia.nombre,
          materia.codigo,
          materia.claveSep,
          materia.profesor?.nombre
        ].some(valor => String(valor || '').toLowerCase().includes(search));
        const matchCiclo = !filters.cicloEscolarId ||
          String(materia.cicloEscolar?.id) === String(filters.cicloEscolarId);
        const matchGrado = !filters.gradoId ||
          materia.grados.some(grado => String(grado.id) === String(filters.gradoId));
        const matchGrupo = !filters.grupoId ||
          materia.grupoIds.some(id => String(id) === String(filters.grupoId));
        const matchProfesor = !filters.profesorId ||
          String(materia.profesorId) === String(filters.profesorId);
        const matchEstado = !filters.estado ||
          materia.estado.toLowerCase() === String(filters.estado).toLowerCase();
        return matchSearch && matchCiclo && matchGrado && matchGrupo &&
          matchProfesor && matchEstado;
      });
  }

  getMateriaById(id) {
    const materia = materiasModel.findById(id);
    if (!materia) throw crearError(`La materia con ID ${id} no fue encontrada.`, 404);
    return this.serializarMateria(materia);
  }

  prepararMateria(data = {}, existing = null) {
    const nombre = String(data.nombre ?? existing?.nombre ?? '').trim();
    const claveSep = String(data.claveSep ?? existing?.claveSep ?? '').trim().toUpperCase();
    const cargaHoraria = String(data.cargaHoraria ?? existing?.cargaHoraria ?? '').trim();
    if (!nombre) throw crearError('El nombre de la materia es obligatorio.', 400);
    if (!claveSep) throw crearError('La clave SEP es obligatoria.', 400);
    if (!cargaHoraria) throw crearError('La carga horaria es obligatoria.', 400);
    if (materiasModel.findByClaveSep(claveSep, existing?.id ?? null)) {
      throw crearError('La clave SEP ya está registrada.', 409);
    }

    const grupoIds = normalizarGrupoIds(data.grupoIds ?? existing?.grupoIds);
    const grupos = grupoIds.map(id => {
      const grupo = gruposModel.findById(id);
      if (!grupo) throw crearError(`El grupo con ID ${id} no fue encontrado.`, 404);
      if (!grupo.cicloEscolar) {
        throw crearError(`El grupo con ID ${id} no tiene una relación académica válida.`, 409);
      }
      return grupo;
    });
    const ciclos = new Set(grupos.map(grupo => Number(grupo.cicloEscolar.id)));
    if (ciclos.size !== 1) {
      throw crearError('Todos los grupos de una materia deben pertenecer al mismo ciclo escolar.', 409);
    }
    const cicloEscolar = grupos[0].cicloEscolar;

    if (!existing && cicloEscolar.estado === ESTADOS_CICLO.FINALIZADO) {
      throw crearError('No se pueden crear materias en un ciclo finalizado.', 409);
    }
    if (existing) {
      const cicloActual = this.serializarMateria(existing).cicloEscolar;
      if (Number(cicloActual?.id) !== Number(cicloEscolar.id)) {
        throw crearError('No se puede mover una materia a otro ciclo escolar.', 409);
      }
    }

    const profesorId = normalizarProfesorId(
      Object.prototype.hasOwnProperty.call(data, 'profesorId')
        ? data.profesorId
        : existing?.profesorId
    );
    if (profesorId === null && cicloEscolar.estado !== ESTADOS_CICLO.PLANEACION) {
      throw crearError('Las materias del ciclo activo deben tener un profesor asignado.', 409);
    }
    if (profesorId !== null) {
      const profesor = profesoresModel.findById(profesorId);
      if (!profesor) throw crearError(`El profesor con ID ${profesorId} no fue encontrado.`, 404);
      if (profesor.estado !== 'Activo') {
        throw crearError('El profesor seleccionado está inactivo y no puede asignarse.', 409);
      }
    }

    const codigoEntrada = String(data.codigo ?? existing?.codigo ?? '').trim().toUpperCase();
    const codigo = codigoEntrada || claveSep.split('-')[0] || nombre.slice(0, 3).toUpperCase();
    const estado = normalizarEstado(data.estado, existing?.estado);
    const isTroncoComun = data.isTroncoComun === undefined
      ? Boolean(existing?.isTroncoComun)
      : Boolean(data.isTroncoComun);

    return {
      codigo,
      nombre,
      claveSep,
      cargaHoraria,
      grupoIds,
      profesorId,
      estado,
      isTroncoComun
    };
  }

  createMateria(data) {
    return this.serializarMateria(materiasModel.create(this.prepararMateria(data)));
  }

  updateMateria(id, data) {
    const existing = materiasModel.findById(id);
    if (!existing) throw crearError(`La materia con ID ${id} no fue encontrada.`, 404);
    const actual = this.serializarMateria(existing);
    if (actual.cicloEscolar?.estado === ESTADOS_CICLO.FINALIZADO) {
      throw crearError('Las materias de ciclos finalizados son de solo lectura.', 409);
    }
    if (
      actual.cicloEscolar?.estado === ESTADOS_CICLO.ACTIVO &&
      data.grupoIds !== undefined &&
      !mismasRelaciones(existing.grupoIds, normalizarGrupoIds(data.grupoIds))
    ) {
      throw crearError('No se pueden cambiar los grupos de una materia del ciclo activo.', 409);
    }
    return this.serializarMateria(
      materiasModel.update(id, this.prepararMateria(data, existing))
    );
  }

  deleteMateria(id) {
    const materia = this.getMateriaById(id);
    if (materia.cicloEscolar?.estado !== ESTADOS_CICLO.PLANEACION) {
      throw crearError('Solo se pueden eliminar materias de ciclos en planeación.', 409);
    }
    return materiasModel.delete(id);
  }

  darDeBajaMateria(id) {
    const materia = this.getMateriaById(id);
    if (materia.cicloEscolar?.estado === ESTADOS_CICLO.FINALIZADO) {
      throw crearError('Las materias de ciclos finalizados son de solo lectura.', 409);
    }
    return this.serializarMateria(materiasModel.darDeBaja(id));
  }

  getMateriasMetrics(filters = {}) {
    const materias = this.getAllMaterias(filters);
    const grupos = new Set();
    const profesores = new Set();
    for (const materia of materias) {
      materia.grupoIds.forEach(id => grupos.add(id));
      if (materia.profesorId !== null) profesores.add(materia.profesorId);
    }
    return {
      total: materias.length,
      activas: materias.filter(materia => materia.estado === ESTADOS_MATERIA.ACTIVA).length,
      enPlaneacion: materias.filter(materia => materia.estado === ESTADOS_MATERIA.PLANEACION).length,
      inactivas: materias.filter(materia => materia.estado === ESTADOS_MATERIA.INACTIVA).length,
      profesoresAsignados: profesores.size,
      gruposConMaterias: grupos.size
    };
  }
}

module.exports = new MateriasService();
module.exports.ESTADOS_MATERIA = ESTADOS_MATERIA;
