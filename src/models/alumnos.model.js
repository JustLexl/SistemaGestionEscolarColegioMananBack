const initialAlumnos = require('../data/alumnos.seed');
const gruposModel = require('./grupos.model');
const mongoSync = require('../database/mongoSync.service');

function normalizar(valor) {
  return String(valor ?? '').trim().toLocaleLowerCase('es-MX');
}

function serializar(alumno) {
  if (!alumno) return null;

  const grupoRelacionado = gruposModel.findById(alumno.grupoId);
  if (!grupoRelacionado) {
    return {
      ...alumno,
      grupo: {
        id: Number(alumno.grupoId) || 0,
        gradoId: '',
        nombre: 'Sin grupo',
        grupoLetra: 'A',
        clave: 'SIN-GRUPO',
        turno: 'matutino',
        estado: 'Activo'
      },
      grado: {
        id: '',
        nombre: 'Sin grado',
        nivel: 'Primaria',
        numeroGrado: 1,
        cicloEscolarId: 0
      },
      cicloEscolar: {
        id: 0,
        nombre: 'General',
        estado: 'Activo'
      }
    };
  }

  const { grado, cicloEscolar, ...grupo } = grupoRelacionado;
  return {
    ...alumno,
    grupo,
    grado: grado || {
      id: String(grupo.gradoId || ''),
      nombre: grupo.gradoNombre || 'Sin grado',
      nivel: 'Primaria',
      numeroGrado: 1,
      cicloEscolarId: 0
    },
    cicloEscolar: cicloEscolar || {
      id: 0,
      nombre: 'General',
      estado: 'Activo'
    }
  };
}

/**
 * Modelo de Datos para la entidad Alumnos.
 * Maneja el almacenamiento en memoria y métodos CRUD.
 */
class AlumnosModel {
  constructor() {
    this.alumnos = initialAlumnos.map(alumno => ({ ...alumno }));
  }

  findAll(filters = {}) {
    const {
      search,
      grupoId,
      gradoId,
      cicloEscolarId,
      grado,
      grupo,
      estado
    } = filters;

    return this.alumnos.map(serializar).filter(alumno => {
      const texto = String(search || '').toLowerCase().trim();

      const matchSearch = !texto ||
        alumno.nombre.toLowerCase().includes(texto) ||
        alumno.matricula.toLowerCase().includes(texto);

      const matchGrupoId = !grupoId || String(alumno.grupoId) === String(grupoId);
      const matchGradoId = !gradoId || String(alumno.grado?.id) === String(gradoId);
      const matchCicloId = !cicloEscolarId ||
        String(alumno.cicloEscolar?.id) === String(cicloEscolarId);
      const matchGradoLegacy = !grado ||
        normalizar(alumno.grado?.nombre) === normalizar(grado);
      const nombresGrupo = [
        alumno.grupo?.nombre,
        alumno.grupo?.grupoLetra,
        alumno.grupo?.grupoLetra ? `Grupo ${alumno.grupo.grupoLetra}` : ''
      ].map(normalizar);
      const matchGrupoLegacy = !grupo || nombresGrupo.includes(normalizar(grupo));
      const matchEstado = !estado || alumno.estado === estado;

      return matchSearch && matchGrupoId && matchGradoId && matchCicloId &&
        matchGradoLegacy && matchGrupoLegacy && matchEstado;
    });
  }

  findById(id) {
    return serializar(this.alumnos.find(
      alumno => String(alumno.id) === String(id)
    ) || null);
  }

  findByMatricula(matricula) {
    return serializar(this.alumnos.find(
      alumno => alumno.matricula === matricula
    ) || null);
  }

  create(data) {
    const nextId = this.alumnos.reduce(
      (max, alumno) => Math.max(max, Number(alumno.id)),
      0
    ) + 1;

    const newAlumno = {
      id: nextId,
      matricula: data.matricula.trim(),
      nombre: data.nombre.trim(),
      fechaNacimiento: data.fechaNacimiento,
      grupoId: Number(data.grupoId),
      tutor: data.tutor.trim(),
      estado: data.estado || 'Activo'
    };

    this.alumnos.push(newAlumno);
    mongoSync.persist('alumnos', newAlumno);
    return serializar(newAlumno);
  }

  update(id, data) {
    const index = this.alumnos.findIndex(
      alumno => String(alumno.id) === String(id)
    );

    if (index === -1) return null;

    this.alumnos[index] = {
      ...this.alumnos[index],
      ...(data.matricula !== undefined && {
        matricula: data.matricula.trim()
      }),
      ...(data.nombre !== undefined && {
        nombre: data.nombre.trim()
      }),
      ...(data.fechaNacimiento !== undefined && {
        fechaNacimiento: data.fechaNacimiento
      }),
      ...(data.grupoId !== undefined && {
        grupoId: Number(data.grupoId)
      }),
      ...(data.tutor !== undefined && {
        tutor: data.tutor.trim()
      }),
      ...(data.estado !== undefined && {
        estado: data.estado
      })
    };

    mongoSync.persist('alumnos', this.alumnos[index]);
    return serializar(this.alumnos[index]);
  }

  delete(id) {
    const index = this.alumnos.findIndex(
      alumno => String(alumno.id) === String(id)
    );

    if (index === -1) return false;

    this.alumnos.splice(index, 1);
    mongoSync.remove('alumnos', Number(id));
    return true;
  }
}

module.exports = new AlumnosModel();
