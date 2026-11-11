const gradosModel = require('../models/grados.model');
const gruposModel = require('../models/grupos.model');

function crearError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class GradosService {
  getAllGrados(filters) {
    return gradosModel.findAll(filters);
  }

  getGradoById(id) {
    const grado = gradosModel.findById(id);
    if (!grado) {
      throw crearError(`El grado con ID ${id} no fue encontrado.`, 404);
    }
    return grado;
  }

  validarGrado(data, existing = null) {
    const grado = {
      nombre: String(data.nombre ?? existing?.nombre ?? '').trim(),
      nivel: String(data.nivel ?? existing?.nivel ?? '').trim(),
      ciclo: String(data.ciclo ?? existing?.ciclo ?? '').trim()
    };

    if (!grado.nombre) throw crearError('El nombre del grado es obligatorio.', 400);
    if (!grado.nivel) throw crearError('El nivel del grado es obligatorio.', 400);
    if (!grado.ciclo) throw crearError('El ciclo escolar es obligatorio.', 400);

    const duplicado = gradosModel.grados.find(item =>
      item.nombre.trim().toLowerCase() === grado.nombre.toLowerCase() &&
      item.ciclo.trim().toLowerCase() === grado.ciclo.toLowerCase() &&
      (!existing || String(item.id) !== String(existing.id))
    );
    if (duplicado) {
      throw crearError('Ya existe ese grado para el ciclo escolar indicado.', 409);
    }

    return grado;
  }

  createGrado(data) {
    return gradosModel.create(this.validarGrado(data));
  }

  updateGrado(id, data) {
    const existing = this.getGradoById(id);
    return gradosModel.update(id, this.validarGrado(data, existing));
  }

  deleteGrado(id) {
    this.getGradoById(id);
    const tieneGrupos = gruposModel.findAll().some(
      grupo => String(grupo.gradoId) === String(id)
    );
    if (tieneGrupos) {
      throw crearError('No se puede eliminar un grado que todavía tiene grupos registrados.', 409);
    }
    return gradosModel.delete(id);
  }
}

module.exports = new GradosService();
