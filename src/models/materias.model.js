const initialMaterias = require('../data/materias.seed');

/**
 * Modelo de Datos para la tabla / entidad Materias.
 * Maneja el almacenamiento en memoria y métodos CRUD.
 */
class MateriasModel {
  constructor() {
    this.materias = [...initialMaterias];
  }

  findAll(filters = {}) {
    const { searchTerm, gradoId, grupo, estado } = filters;
    return this.materias.filter(materia => {
      const matchSearch = !searchTerm ||
        materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materia.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materia.claveSep.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materia.profesorNombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGrado = !gradoId || String(materia.gradoId) === String(gradoId);
      const matchGrupo = !grupo || materia.gruposAsignados.some(g => g.toLowerCase().includes(grupo.toLowerCase()));
      const matchEstado = !estado || materia.estado.toLowerCase() === estado.toLowerCase();

      return matchSearch && matchGrado && matchGrupo && matchEstado;
    });
  }

  findById(id) {
    const numericId = Number(id);
    return this.materias.find(m => m.id === numericId) || null;
  }

  create(data) {
    const maxId = this.materias.reduce((acc, m) => (m.id > acc ? m.id : acc), 0);
    const id = maxId + 1;

    const gruposAsignados = Array.isArray(data.gruposAsignados) && data.gruposAsignados.length > 0
      ? data.gruposAsignados
      : [`${data.gradoId || '1'}° A`];

    const codigo = data.codigo ||
      (data.claveSep ? data.claveSep.split('-')[0] : data.nombre.slice(0, 3).toUpperCase());

    const alumnosImpactados = data.alumnosImpactados !== undefined
      ? Number(data.alumnosImpactados)
      : gruposAsignados.length * 36;

    const newMateria = {
      id,
      codigo,
      nombre: data.nombre.trim(),
      claveSep: data.claveSep ? data.claveSep.trim() : `MAT-PRI-0${data.gradoId || 1}`,
      cargaHoraria: data.cargaHoraria || '4 hrs/sem',
      gradoId: String(data.gradoId || '1'),
      gradoNombre: data.gradoNombre || `${data.gradoId || '1'}° Primaria`,
      gruposAsignados,
      profesorId: Number(data.profesorId) || 1,
      profesorNombre: data.profesorNombre || 'Profra. Carmen Salinas',
      profesorIniciales: data.profesorIniciales || 'CS',
      cedula: data.cedula || 'DOC-2018-042',
      alumnosImpactados,
      gruposCount: gruposAsignados.length,
      estado: data.estado || 'Activa',
      isTroncoComun: Boolean(data.isTroncoComun)
    };

    this.materias.unshift(newMateria);
    return newMateria;
  }

  update(id, data) {
    const numericId = Number(id);
    const index = this.materias.findIndex(m => m.id === numericId);
    if (index === -1) return null;

    const grupos = data.gruposAsignados !== undefined ? data.gruposAsignados : this.materias[index].gruposAsignados;
    const impactados = data.alumnosImpactados !== undefined ? Number(data.alumnosImpactados) : (grupos.length * 36);

    this.materias[index] = {
      ...this.materias[index],
      ...(data.codigo !== undefined && { codigo: data.codigo }),
      ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
      ...(data.claveSep !== undefined && { claveSep: data.claveSep.trim() }),
      ...(data.cargaHoraria !== undefined && { cargaHoraria: data.cargaHoraria }),
      ...(data.gradoId !== undefined && { gradoId: String(data.gradoId) }),
      ...(data.gradoNombre !== undefined && { gradoNombre: data.gradoNombre }),
      ...(data.gruposAsignados !== undefined && { gruposAsignados: data.gruposAsignados, gruposCount: data.gruposAsignados.length }),
      ...(data.profesorId !== undefined && { profesorId: Number(data.profesorId) }),
      ...(data.profesorNombre !== undefined && { profesorNombre: data.profesorNombre }),
      ...(data.profesorIniciales !== undefined && { profesorIniciales: data.profesorIniciales }),
      ...(data.cedula !== undefined && { cedula: data.cedula }),
      alumnosImpactados: impactados,
      ...(data.estado !== undefined && { estado: data.estado }),
      ...(data.isTroncoComun !== undefined && { isTroncoComun: Boolean(data.isTroncoComun) })
    };
    return this.materias[index];
  }

  delete(id) {
    const numericId = Number(id);
    const index = this.materias.findIndex(m => m.id === numericId);
    if (index === -1) return false;
    this.materias.splice(index, 1);
    return true;
  }

  darDeBaja(id) {
    const numericId = Number(id);
    const materia = this.materias.find(m => m.id === numericId);
    if (!materia) return null;
    materia.estado = 'Inactiva';
    return materia;
  }

  getMetrics() {
    const total = this.materias.length;
    const activas = this.materias.filter(m => m.estado === 'Activa').length;
    const enPlaneacion = this.materias.filter(m => m.estado === 'En planeacion').length;
    const inactivas = this.materias.filter(m => m.estado === 'Inactiva').length;
    const totalImpactados = this.materias.reduce((acc, m) => acc + (m.estado === 'Activa' ? m.alumnosImpactados : 0), 0);
    const profesoresAsignados = new Set(this.materias.filter(m => m.estado === 'Activa').map(m => m.profesorId)).size;

    return {
      total,
      activas,
      enPlaneacion,
      inactivas,
      totalImpactados,
      profesoresAsignados
    };
  }
}

module.exports = new MateriasModel();
