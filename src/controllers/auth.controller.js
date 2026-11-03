const authService = require('../services/auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const resultado = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión correcto.',
        token: resultado.firebaseUser.idToken,
        usuario: {
          id: resultado.usuario.id,
          nombre: resultado.usuario.nombre,
          correo: resultado.usuario.correo,
          puesto: resultado.usuario.puesto,
          rol: resultado.rol,
          estado: resultado.usuario.estado
        }
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor.'
      });
    }
  }

  logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente.'
    });
  }

  async resetPassword(req, res) {
    try {
      const { email } = req.body;

      const resultado = await authService.restablecerPassword(email);

      return res.status(200).json({
        success: true,
        message: 'Se envió el correo para restablecer la contraseña.',
        email: resultado.email
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor.'
      });
    }
  }
}

module.exports = new AuthController();