require('dotenv').config();
const rolesModel = require('../src/models/roles.model');
const authService = require('../src/services/auth.service');

async function testMongoAuth() {
  console.log('--- Probando Autenticación 100% MongoDB ---');

  // 1. Crear un usuario de prueba con contraseña
  const testEmail = `directivo.test.${Date.now()}@manantial.edu.mx`;
  const testPass = 'Colegio2026*';

  const user = rolesModel.create({
    nombre: 'Director General',
    puesto: 'Directivos',
    correo: testEmail,
    contrasena: testPass,
    estado: 'Activo'
  });

  console.log('Usuario creado en modelo/Mongo:', user);

  // 2. Probar login con credenciales correctas
  try {
    const loginOk = await authService.login(testEmail, testPass);
    console.log('✅ Login exitoso:', {
      usuario: loginOk.usuario.nombre,
      rol: loginOk.rol,
      token: loginOk.token
    });
  } catch (err) {
    console.error('❌ Falló login correcto:', err.message);
  }

  // 3. Probar login con contraseña incorrecta
  try {
    await authService.login(testEmail, 'wrongPassword');
    console.error('❌ Debería haber fallado con contraseña incorrecta');
  } catch (err) {
    console.log('✅ Rechazo correcto de contraseña inválida:', err.message);
  }

  // 4. Limpiar usuario de prueba
  rolesModel.delete(user.id);
  console.log('Usuario de prueba eliminado.');
}

testMongoAuth();
