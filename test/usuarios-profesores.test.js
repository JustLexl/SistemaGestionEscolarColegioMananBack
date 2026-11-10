const assert = require('node:assert/strict');
const { afterEach, beforeEach, describe, test } = require('node:test');

const rolesModel = require('../src/models/roles.model');
const profesoresModel = require('../src/models/profesores.model');
const profesoresService = require('../src/services/profesores.service');
const usuariosProfesoresService = require('../src/services/usuarios-profesores.service');
const { validarProfesores } = require('../src/services/importacion.service');

let rolesIniciales;
let profesoresIniciales;

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

beforeEach(() => {
  rolesIniciales = clonar(rolesModel.roles);
  profesoresIniciales = clonar(profesoresModel.profesores);
});

afterEach(() => {
  rolesModel.roles.splice(0, rolesModel.roles.length, ...rolesIniciales);
  profesoresModel.profesores.splice(
    0,
    profesoresModel.profesores.length,
    ...profesoresIniciales
  );
});

describe('relación Usuario/Rol y Profesor', { concurrency: false }, () => {
  test('el alta de un usuario Profesor crea un perfil relacionado con ID independiente', () => {
    const resultado = usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde({
      nombre: 'Profesor Relacionado Demo',
      correo: 'profesor.relacionado.demo@manantial.edu.mx',
      puesto: 'Profesores',
      cedula: 'DOC-DEMO-REL-001',
      estado: 'Activo'
    });

    assert.ok(resultado.usuario.id);
    assert.ok(resultado.profesor.id);
    assert.notEqual(resultado.profesor.id, resultado.usuario.id);
    assert.equal(resultado.profesor.usuarioId, resultado.usuario.id);
    assert.equal(resultado.profesor.nombre, resultado.usuario.nombre);
    assert.deepEqual(resultado.profesor.materias, []);
    assert.deepEqual(resultado.profesor.grupos, []);
  });

  test('Directivos y Administrativo crean solamente el usuario', () => {
    const directivo = usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde({
      nombre: 'Usuario Directivo Demo',
      correo: 'directivo.demo@manantial.edu.mx',
      puesto: 'Directivos',
      estado: 'Activo'
    });
    const administrativo = usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde({
      nombre: 'Usuario Administrativo Demo',
      correo: 'administrativo.demo@manantial.edu.mx',
      puesto: 'Administrativo',
      estado: 'Activo'
    });

    assert.equal(directivo.profesor, null);
    assert.equal(administrativo.profesor, null);
    assert.equal(profesoresModel.findByUsuarioId(directivo.usuario.id), null);
    assert.equal(profesoresModel.findByUsuarioId(administrativo.usuario.id), null);
  });

  test('rechaza un segundo perfil para el mismo usuarioId', () => {
    const { usuario } = usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde({
      nombre: 'Profesora Única',
      correo: 'profesora.unica@manantial.edu.mx',
      puesto: 'Profesores',
      cedula: 'DOC-UNICA-001'
    });

    assert.throws(
      () => profesoresService.createProfesor({
        usuarioId: usuario.id,
        nombre: 'Perfil duplicado',
        cedula: 'DOC-UNICA-002'
      }),
      error => error.statusCode === 409 && /ya tiene un perfil/i.test(error.message)
    );
  });

  test('rechaza una cédula duplicada sin dejar un usuario huérfano', () => {
    const cantidadInicial = rolesModel.roles.length;

    assert.throws(
      () => usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde({
        nombre: 'Profesor Cédula Duplicada',
        correo: 'cedula.duplicada@manantial.edu.mx',
        puesto: 'Profesores',
        cedula: 'DOC-2018-042'
      }),
      error => error.statusCode === 409 && /cédula/i.test(error.message)
    );

    assert.equal(rolesModel.roles.length, cantidadInicial);
    assert.equal(rolesModel.findByCorreo('cedula.duplicada@manantial.edu.mx'), null);
  });

  test('hace rollback del usuario si falla inesperadamente la creación del perfil', () => {
    const createOriginal = profesoresService.createProfesor;
    profesoresService.createProfesor = () => {
      throw new Error('fallo simulado del perfil');
    };

    try {
      assert.throws(
        () => usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde({
          nombre: 'Profesor Rollback',
          correo: 'rollback@manantial.edu.mx',
          puesto: 'Profesores',
          cedula: 'DOC-ROLLBACK-001'
        }),
        /fallo simulado/
      );
      assert.equal(rolesModel.findByCorreo('rollback@manantial.edu.mx'), null);
    } finally {
      profesoresService.createProfesor = createOriginal;
    }
  });

  test('cambio de rol crea, inactiva y reactiva el mismo perfil Profesor', () => {
    const { usuario } = usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde({
      nombre: 'Usuario Cambiable',
      correo: 'usuario.cambiable@manantial.edu.mx',
      puesto: 'Administrativo'
    });

    const comoProfesor = usuariosProfesoresService.actualizarUsuarioYPerfil(usuario.id, {
      puesto: 'Profesores',
      cedula: 'DOC-CAMBIO-001'
    });
    const profesorId = comoProfesor.profesor.id;
    assert.equal(comoProfesor.profesor.estado, 'Activo');

    const comoDirectivo = usuariosProfesoresService.actualizarUsuarioYPerfil(usuario.id, {
      puesto: 'Directivos'
    });
    assert.equal(comoDirectivo.profesor.id, profesorId);
    assert.equal(comoDirectivo.profesor.estado, 'Inactivo');

    const reactivado = usuariosProfesoresService.actualizarUsuarioYPerfil(usuario.id, {
      puesto: 'Profesores'
    });
    assert.equal(reactivado.profesor.id, profesorId);
    assert.equal(reactivado.profesor.estado, 'Activo');
  });

  test('sincroniza estado y nombre del usuario con su perfil Profesor', () => {
    const { usuario } = usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde({
      nombre: 'Nombre Original',
      correo: 'sincronizacion@manantial.edu.mx',
      puesto: 'Profesores',
      cedula: 'DOC-SYNC-001'
    });

    const inactivo = usuariosProfesoresService.cambiarEstadoUsuario(usuario.id);
    assert.equal(inactivo.usuario.estado, 'Inactivo');
    assert.equal(inactivo.profesor.estado, 'Inactivo');

    const activo = usuariosProfesoresService.cambiarEstadoUsuario(usuario.id);
    assert.equal(activo.usuario.estado, 'Activo');
    assert.equal(activo.profesor.estado, 'Activo');

    const renombrado = usuariosProfesoresService.actualizarUsuarioYPerfil(usuario.id, {
      nombre: 'Nombre Sincronizado'
    });
    assert.equal(renombrado.profesor.nombre, 'Nombre Sincronizado');
  });
});

describe('importación de profesores', { concurrency: false }, () => {
  test('una fila válida crea Usuario/Rol y Profesor con la misma lógica coordinada', () => {
    const validacion = validarProfesores([{
      nombre: 'Profesor Importado Demo',
      puesto: 'Profesores',
      correo: 'profesor.importado.demo@manantial.edu.mx',
      cedula: 'DOC-IMPORT-001',
      estado: 'Activo'
    }]);

    assert.equal(validacion.totalValidos, 1);
    assert.equal(validacion.totalErrores, 0);

    const resultado = usuariosProfesoresService
      .crearUsuarioConPerfilSiCorresponde(validacion.validos[0]);
    assert.equal(resultado.profesor.usuarioId, resultado.usuario.id);
    assert.notEqual(resultado.profesor.id, resultado.usuario.id);
  });

  test('rechaza filas sin cédula, con rol incorrecto o con encabezados faltantes', () => {
    const sinCedula = validarProfesores([{
      nombre: 'Profesor Sin Cédula',
      puesto: 'Profesores',
      correo: 'sin.cedula@manantial.edu.mx',
      cedula: '',
      estado: 'Activo'
    }]);
    const rolIncorrecto = validarProfesores([{
      nombre: 'Directivo Importado',
      puesto: 'Directivos',
      correo: 'directivo.importado@manantial.edu.mx',
      cedula: 'DOC-DIR-001',
      estado: 'Activo'
    }]);
    const encabezadosFaltantes = validarProfesores([{
      nombre: 'Fila incompleta',
      correo: 'fila.incompleta@manantial.edu.mx'
    }]);

    assert.equal(sinCedula.totalErrores, 1);
    assert.match(sinCedula.errores[0].motivos.join(' '), /cedula/i);
    assert.equal(rolIncorrecto.totalErrores, 1);
    assert.match(rolIncorrecto.errores[0].motivos.join(' '), /Profesores/);
    assert.equal(encabezadosFaltantes.totalErrores, 1);
    assert.match(encabezadosFaltantes.errores[0], /Faltan columnas/);
  });

  test('detecta correos y cédulas duplicados dentro del archivo y contra el sistema', () => {
    const duplicadosArchivo = validarProfesores([
      {
        nombre: 'Profesor Uno',
        puesto: 'Profesores',
        correo: 'duplicado.archivo@manantial.edu.mx',
        cedula: 'DOC-ARCHIVO-001',
        estado: 'Activo'
      },
      {
        nombre: 'Profesor Dos',
        puesto: 'Profesores',
        correo: 'duplicado.archivo@manantial.edu.mx',
        cedula: 'DOC-ARCHIVO-001',
        estado: 'Activo'
      }
    ]);
    const duplicadosSistema = validarProfesores([{
      nombre: 'Profesor Existente',
      puesto: 'Profesores',
      correo: 'elena.garro@manantial.edu.mx',
      cedula: 'DOC-2019-018',
      estado: 'Activo'
    }]);

    assert.equal(duplicadosArchivo.totalErrores, 1);
    assert.match(duplicadosArchivo.errores[0].motivos.join(' '), /Correo duplicado/);
    assert.match(duplicadosArchivo.errores[0].motivos.join(' '), /Cédula duplicada/);
    assert.equal(duplicadosSistema.totalErrores, 1);
    assert.match(duplicadosSistema.errores[0].motivos.join(' '), /correo ya está registrado/i);
    assert.match(duplicadosSistema.errores[0].motivos.join(' '), /cédula ya está registrada/i);
  });
});
