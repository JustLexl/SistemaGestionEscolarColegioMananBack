const rolesModel = require('../models/roles.model');

class AuthService {
  validarCampos(email, password) {
    if (!email || !password) {
      const error = new Error('El correo y la contraseña son obligatorios.');
      error.status = 400;
      throw error;
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      const error = new Error('Las credenciales tienen un formato inválido.');
      error.status = 400;
      throw error;
    }
  }

  async buscarUsuarioPorCorreo(email) {
    let usuario = rolesModel.findByCorreo(email);

    if (!usuario) {
      try {
        const { getDBStatus } = require('../config/database');
        const { RolMongo } = require('../database/schemas');
        if (getDBStatus().isConnected && RolMongo) {
          const doc = await RolMongo.findOne({ correo: String(email).trim().toLowerCase() }).lean();
          if (doc) {
            const { _id, createdAt, updatedAt, __v, ...rest } = doc;
            usuario = rest;
            if (!rolesModel.roles.some(r => r.id === usuario.id)) {
              rolesModel.roles.push(usuario);
            }
          }
        }
      } catch (err) {
        console.warn('[AuthService] Error buscando en Mongo directo:', err.message);
      }
    }

    if (!usuario) {
      const error = new Error('Credenciales incorrectas.');
      error.status = 401;
      throw error;
    }

    return usuario;
  }

  validarEstadoUsuario(usuario) {
    if (usuario.estado && usuario.estado.toLowerCase() !== 'activo') {
      const error = new Error('El usuario se encuentra inactivo.');
      error.status = 403;
      throw error;
    }
  }

  validarRolUsuario(usuario) {
    const rolesPermitidos = [
      'Directivos',
      'Profesores',
      'Administrativo'
    ];

    if (!usuario.puesto || !rolesPermitidos.includes(usuario.puesto)) {
      const error = new Error(
        'El usuario no tiene un rol válido para acceder al sistema.'
      );
      error.status = 403;
      throw error;
    }

    return usuario.puesto;
  }

  validarPassword(usuario, passwordProporcionada) {
    const passwordGuardada = usuario.contrasena || usuario.password;

    if (!passwordGuardada) {
      const error = new Error('El usuario no tiene una contraseña configurada en la base de datos.');
      error.status = 401;
      throw error;
    }

    if (String(passwordGuardada).trim() !== String(passwordProporcionada).trim()) {
      const error = new Error('Credenciales incorrectas.');
      error.status = 401;
      throw error;
    }
  }

  generarToken(usuario) {
    const payload = `${usuario.id}:${usuario.correo}:${Date.now()}`;
    return 'token_cm_' + Buffer.from(payload).toString('base64');
  }

  async restablecerPassword(email) {
    if (!email || typeof email !== 'string') {
      const error = new Error('El correo es obligatorio.');
      error.status = 400;
      throw error;
    }

    const usuario = await this.buscarUsuarioPorCorreo(email);
    this.validarEstadoUsuario(usuario);

    return {
      email: usuario.correo,
      message: 'Solicitud de restablecimiento procesada en base de datos.'
    };
  }

  async login(email, password) {
    this.validarCampos(email, password);

    const usuario = await this.buscarUsuarioPorCorreo(email);

    this.validarEstadoUsuario(usuario);

    const rol = this.validarRolUsuario(usuario);

    this.validarPassword(usuario, password);

    const token = this.generarToken(usuario);

    return {
      usuario,
      rol,
      token,
      firebaseUser: { idToken: token }
    };
  }
}

module.exports = new AuthService();
