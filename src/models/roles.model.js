const initialRoles = require('../data/roles.seed');

/**
 * Modelo de Datos para la tabla / entidad Roles.
 * Maneja el almacenamiento en memoria y métodos CRUD.
 */
class RolesModel {
  constructor() {
    this.roles = [...initialRoles];
  }

  findAll(filters = {}) {
    const { searchTerm, estado, puesto } = filters;
    return this.roles.filter(rol => {
      const matchSearch = !searchTerm ||
        rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rol.puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rol.correo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEstado = !estado || rol.estado.toLowerCase() === estado.toLowerCase();
      const matchPuesto = !puesto || rol.puesto.toLowerCase() === puesto.toLowerCase();

      return matchSearch && matchEstado && matchPuesto;
    });
  }

  findById(id) {
    const numericId = Number(id);
    return this.roles.find(r => r.id === numericId) || null;
  }

  findByCorreo(correo) {
    return this.roles.find(r => r.correo.toLowerCase() === correo.trim().toLowerCase()) || null;
  }

  create(data) {
    const maxId = this.roles.reduce((acc, r) => (r.id > acc ? r.id : acc), 0);
    const newRol = {
      id: maxId + 1,
      nombre: data.nombre.trim(),
      puesto: data.puesto,
      correo: data.correo.trim().toLowerCase(),
      estado: data.estado || 'Activo'
    };
    this.roles.unshift(newRol);
    return newRol;
  }

  update(id, data) {
    const numericId = Number(id);
    const index = this.roles.findIndex(r => r.id === numericId);
    if (index === -1) return null;

    this.roles[index] = {
      ...this.roles[index],
      ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
      ...(data.puesto !== undefined && { puesto: data.puesto }),
      ...(data.correo !== undefined && { correo: data.correo.trim().toLowerCase() }),
      ...(data.estado !== undefined && { estado: data.estado })
    };
    return this.roles[index];
  }

  delete(id) {
    const numericId = Number(id);
    const index = this.roles.findIndex(r => r.id === numericId);
    if (index === -1) return false;
    this.roles.splice(index, 1);
    return true;
  }

  toggleEstado(id) {
    const numericId = Number(id);
    const rol = this.roles.find(r => r.id === numericId);
    if (!rol) return null;
    rol.estado = rol.estado === 'Activo' ? 'Inactivo' : 'Activo';
    return rol;
  }

  getMetrics() {
    const total = this.roles.length;
    const activos = this.roles.filter(r => r.estado === 'Activo').length;
    const inactivos = this.roles.filter(r => r.estado === 'Inactivo').length;
    return { total, activos, inactivos };
  }
}

module.exports = new RolesModel();
