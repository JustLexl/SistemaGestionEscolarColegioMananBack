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

  buscarUsuarioPorCorreo(email) {
    const usuario = rolesModel.findByCorreo(email);

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

  async validarCredencialesFirebase(email, password) {
    const apiKey = process.env.FIREBASE_WEB_API_KEY;

    if (!apiKey) {
      const error = new Error('FIREBASE_WEB_API_KEY no está configurada.');
      error.status = 500;
      throw error;
    }

    const url =
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const firebaseError = data?.error?.message;

      const error = new Error(
        firebaseError === 'INVALID_LOGIN_CREDENTIALS'
          ? 'Credenciales incorrectas.'
          : 'No fue posible iniciar sesión.'
      );

      error.status = 401;
      throw error;
    }

    return {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn
    };
  }

  async restablecerPassword(email) {
    if (!email || typeof email !== 'string') {
      const error = new Error('El correo es obligatorio.');
      error.status = 400;
      throw error;
    }

    const apiKey = process.env.FIREBASE_WEB_API_KEY;

    if (!apiKey) {
      const error = new Error('FIREBASE_WEB_API_KEY no está configurada.');
      error.status = 500;
      throw error;
    }

    const usuario = this.buscarUsuarioPorCorreo(email);

    this.validarEstadoUsuario(usuario);

    const url =
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        'No fue posible enviar el correo para restablecer la contraseña.'
      );
      error.status = 400;
      throw error;
    }

    return {
      email: data.email
    };
  }

  async login(email, password) {
    this.validarCampos(email, password);

    const usuario = this.buscarUsuarioPorCorreo(email);

    this.validarEstadoUsuario(usuario);

    const rol = this.validarRolUsuario(usuario);

    const firebaseUser = await this.validarCredencialesFirebase(
      email,
      password
    );

    return {
      usuario,
      rol,
      firebaseUser
    };
  }
}

module.exports = new AuthService();