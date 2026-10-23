const initialGrupos = require('../data/grupos.seed');

/**
 * Modelo de Datos para la tabla / entidad Grupos.
 * Maneja el almacenamiento en memoria y métodos CRUD.
 */
class GruposModel {
  constructor() {
    this.grupos = [...initialGrupos];
  }

  findAll(filters = {}) {
    const { searchTerm, gradoId, turno, estado } = filters;
    return this.grupos.filter(grupo => {
      const matchSearch = !searchTerm ||
        grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.aula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.profesorNombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGrado = !gradoId || String(grupo.gradoId) === String(gradoId);
      const matchTurno = !turno || grupo.turno.toLowerCase() === turno.toLowerCase();
      const matchEstado = !estado || grupo.estado.toLowerCase() === estado.toLowerCase();

      return matchSearch && matchGrado && matchTurno && matchEstado;
    });
  }

  findById(id) {
    const numericId = Number(id);
    return this.grupos.find(g => g.id === numericId) || null;
  }

  create(data) {
    const maxId = this.grupos.reduce((acc, g) => (g.id > acc ? g.id : acc), 0);
    const id = maxId + 1;

    const letraMatch = (data.nombre || '').match(/Grupo\s+([A-Z])/i);
    const grupoLetra = data.grupoLetra || (letraMatch ? letraMatch[1].toUpperCase() : 'A');
    const gradoId = String(data.gradoId || '1');
    const clave = data.clave || `CM-PRI-${gradoId}${grupoLetra}-24`;

    const newGrupo = {
      id,
      gradoId,
      gradoNombre: data.gradoNombre || `${gradoId}° Grado`,
      grupoLetra,
      nombre: data.nombre || `${data.gradoNombre || `${gradoId}° Grado`} - Grupo ${grupoLetra}`,
      clave,
      aula: data.aula || 'Aula 100',
      edificio: data.edificio || 'Edificio Principal',
      turno: data.turno || 'matutino',
      profesorId: Number(data.profesorId) || 0,
      profesorNombre: data.profesorNombre || 'Profesor Sin Asignar',
      profesorIniciales: data.profesorIniciales || 'SA',
      cedula: data.cedula || 'DOC-2024-000',
      materias: Array.isArray(data.materias) ? data.materias : ['Español', 'Matemáticas'],
      alumnosActuales: Number(data.alumnosActuales) || 0,
      alumnosMax: Number(data.alumnosMax) || 40,
      estado: data.estado || 'Activo',
      isBase: Boolean(data.isBase)
    };

    this.grupos.unshift(newGrupo);
    return newGrupo;
  }

  update(id, data) {
    const numericId = Number(id);
    const index = this.grupos.findIndex(g => g.id === numericId);
    if (index === -1) return null;

    this.grupos[index] = {
      ...this.grupos[index],
      ...(data.gradoId !== undefined && { gradoId: String(data.gradoId) }),
      ...(data.gradoNombre !== undefined && { gradoNombre: data.gradoNombre }),
      ...(data.grupoLetra !== undefined && { grupoLetra: data.grupoLetra }),
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.clave !== undefined && { clave: data.clave }),
      ...(data.aula !== undefined && { aula: data.aula }),
      ...(data.edificio !== undefined && { edificio: data.edificio }),
      ...(data.turno !== undefined && { turno: data.turno }),
      ...(data.profesorId !== undefined && { profesorId: Number(data.profesorId) }),
      ...(data.profesorNombre !== undefined && { profesorNombre: data.profesorNombre }),
      ...(data.profesorIniciales !== undefined && { profesorIniciales: data.profesorIniciales }),
      ...(data.cedula !== undefined && { cedula: data.cedula }),
      ...(data.materias !== undefined && { materias: data.materias }),
      ...(data.alumnosActuales !== undefined && { alumnosActuales: Number(data.alumnosActuales) }),
      ...(data.alumnosMax !== undefined && { alumnosMax: Number(data.alumnosMax) }),
      ...(data.estado !== undefined && { estado: data.estado }),
      ...(data.isBase !== undefined && { isBase: Boolean(data.isBase) })
    };
    return this.grupos[index];
  }

  delete(id) {
    const numericId = Number(id);
    const index = this.grupos.findIndex(g => g.id === numericId);
    if (index === -1) return false;
    this.grupos.splice(index, 1);
    return true;
  }

  toggleEstado(id) {
    const numericId = Number(id);
    const grupo = this.grupos.find(g => g.id === numericId);
    if (!grupo) return null;
    grupo.estado = grupo.estado === 'Activo' ? 'Inactivo' : 'Activo';
    return grupo;
  }

  getMetrics() {
    const total = this.grupos.length;
    const activos = this.grupos.filter(g => g.estado === 'Activo').length;
    const gradosCount = new Set(this.grupos.map(g => g.gradoId)).size;
    const aulasCount = new Set(this.grupos.map(g => g.aula)).size;
    const matriculaTotal = this.grupos.reduce((acc, g) => acc + (g.estado === 'Activo' ? g.alumnosActuales : 0), 0);
    const promedioAlumnos = activos > 0 ? Math.round(matriculaTotal / activos) : 0;

    return {
      total,
      activos,
      gradosCount,
      aulasCount,
      matriculaTotal,
      promedioAlumnos
    };
  }
}

module.exports = new GruposModel();
