const assert = require('node:assert/strict');
const { beforeEach, describe, test } = require('node:test');

const alumnosModel = require('../src/models/alumnos.model');
const gruposModel = require('../src/models/grupos.model');
const gradosModel = require('../src/models/grados.model');
const ciclosModel = require('../src/models/ciclos-escolares.model');
const alumnosService = require('../src/services/alumnos.service');
const { validarAlumnos } = require('../src/services/importacion.service');

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

const inicial = {
  alumnos: clonar(alumnosModel.alumnos),
  grupos: clonar(gruposModel.grupos),
  grados: clonar(gradosModel.grados),
  ciclos: clonar(ciclosModel.ciclos)
};

beforeEach(() => {
  alumnosModel.alumnos.splice(0, alumnosModel.alumnos.length, ...clonar(inicial.alumnos));
  gruposModel.grupos.splice(0, gruposModel.grupos.length, ...clonar(inicial.grupos));
  gradosModel.grados.splice(0, gradosModel.grados.length, ...clonar(inicial.grados));
  ciclosModel.ciclos.splice(0, ciclosModel.ciclos.length, ...clonar(inicial.ciclos));
});

function datosAlumno(overrides = {}) {
  return {
    matricula: 'CM-2026-006',
    nombre: 'Alumno Demo',
    fechaNacimiento: '2015-06-10',
    grupoId: 10,
    tutor: 'Tutor Demo',
    estado: 'Activo',
    ...overrides
  };
}

function agregarGrupoActivoMismoCiclo() {
  return gruposModel.create({
    gradoId: '7',
    gradoNombre: '1° Secundaria',
    grupoLetra: 'B',
    nombre: '1° Secundaria - Grupo B',
    clave: 'CM-SEC-1B-26',
    estado: 'Activo'
  });
}

describe('Alumno relacionado con Grupo real', { concurrency: false }, () => {
  test('migra las cinco semillas a grupoId de forma determinista', () => {
    assert.deepEqual(
      alumnosModel.alumnos.map(alumno => alumno.grupoId),
      [1, 2, 3, 4, 5]
    );
    assert.ok(alumnosModel.alumnos.every(alumno =>
      !Object.hasOwn(alumno, 'grado') && !Object.hasOwn(alumno, 'grupo')
    ));
  });

  test('GET lógico de alumnos devuelve el Grupo relacionado', () => {
    const sofia = alumnosService.getAllAlumnos({})[0];
    assert.equal(sofia.grupoId, 1);
    assert.equal(sofia.grupo.grupoLetra, 'A');
  });

  test('GET lógico de alumno deriva el Grado', () => {
    const sofia = alumnosService.getAlumnoById(1);
    assert.equal(sofia.grado.id, '4');
    assert.equal(sofia.grado.nombre, '4° Primaria');
  });

  test('GET lógico de alumno deriva el CicloEscolar', () => {
    const sofia = alumnosService.getAlumnoById(1);
    assert.equal(sofia.cicloEscolar.id, 1);
    assert.equal(sofia.cicloEscolar.estado, 'Finalizado');
  });

  test('crea un alumno con grupoId válido del ciclo Activo', () => {
    const alumno = alumnosService.createAlumno(datosAlumno());
    assert.equal(alumno.grupoId, 10);
    assert.equal(alumno.cicloEscolar.estado, 'Activo');
  });

  test('rechaza crear un alumno sin grupoId', () => {
    const data = datosAlumno();
    delete data.grupoId;
    assert.throws(() => alumnosService.createAlumno(data),
      error => error.statusCode === 400 && /grupoId/i.test(error.message));
  });

  test('rechaza grupoId inválido', () => {
    assert.throws(() => alumnosService.createAlumno(datosAlumno({ grupoId: 'abc' })),
      error => error.statusCode === 400);
  });

  test('reporta Grupo inexistente con 404', () => {
    assert.throws(() => alumnosService.createAlumno(datosAlumno({ grupoId: 999 })),
      error => error.statusCode === 404);
  });

  test('rechaza una nueva inscripción en ciclo Finalizado', () => {
    assert.throws(() => alumnosService.createAlumno(datosAlumno({ grupoId: 1 })),
      error => error.statusCode === 409 && /ciclo escolar Activo/i.test(error.message));
  });

  test('rechaza una nueva inscripción en ciclo en Planeación', () => {
    gradosModel.grados.push({
      id: '8', nivel: 'Secundaria', numeroGrado: 2,
      nombre: '2° Secundaria', cicloEscolarId: 3
    });
    const grupo = gruposModel.create({
      gradoId: '8', grupoLetra: 'A', clave: 'CM-SEC-2A-27', estado: 'Activo'
    });
    assert.throws(() => alumnosService.createAlumno(datosAlumno({ grupoId: grupo.id })),
      error => error.statusCode === 409 && /planeación/i.test(error.message));
  });

  test('rechaza una matrícula duplicada', () => {
    assert.throws(
      () => alumnosService.createAlumno(datosAlumno({ matricula: 'CM-2026-001' })),
      error => error.statusCode === 409
    );
  });

  test('permite editar datos personales de un alumno histórico', () => {
    const actualizado = alumnosService.updateAlumno(1, { nombre: 'Sofía Corregida' });
    assert.equal(actualizado.nombre, 'Sofía Corregida');
    assert.equal(actualizado.grupoId, 1);
  });

  test('permite cambiar de grupo dentro del mismo ciclo Activo', () => {
    const alumno = alumnosService.createAlumno(datosAlumno());
    const grupoB = agregarGrupoActivoMismoCiclo();
    const actualizado = alumnosService.updateAlumno(alumno.id, { grupoId: grupoB.id });
    assert.equal(actualizado.grupoId, grupoB.id);
    assert.equal(actualizado.cicloEscolar.id, 2);
  });

  test('rechaza cambiar un alumno a un grupo de otro ciclo', () => {
    const alumno = alumnosService.createAlumno(datosAlumno());
    ciclosModel.ciclos[2].fechaInicio = '2026-09-01';
    ciclosModel.ciclos[2].fechaFin = '2027-06-30';
    gradosModel.grados.push({
      id: '8', nivel: 'Secundaria', numeroGrado: 2,
      nombre: '2° Secundaria', cicloEscolarId: 3
    });
    const otroCiclo = gruposModel.create({
      gradoId: '8', grupoLetra: 'A', clave: 'CM-SEC-2A-OTRO', estado: 'Activo'
    });
    assert.throws(() => alumnosService.updateAlumno(alumno.id, { grupoId: otroCiclo.id }),
      error => error.statusCode === 409 && /mismo ciclo/i.test(error.message));
  });

  test('bloquea cambiar la relación académica histórica', () => {
    assert.throws(() => alumnosService.updateAlumno(1, { grupoId: 10 }),
      error => error.statusCode === 409 && /historial/i.test(error.message));
  });

  test('dar de baja conserva grupoId y la cadena académica', () => {
    const alumno = alumnosService.darDeBajaAlumno(1);
    assert.equal(alumno.estado, 'Inactivo');
    assert.equal(alumno.grupoId, 1);
    assert.equal(alumno.grado.id, '4');
  });

  test('filtra por grupoId real', () => {
    const alumnos = alumnosService.getAllAlumnos({ grupoId: 2 });
    assert.deepEqual(alumnos.map(alumno => alumno.id), [2]);
  });

  test('filtra por gradoId derivado', () => {
    const alumnos = alumnosService.getAllAlumnos({ gradoId: '4' });
    assert.deepEqual(alumnos.map(alumno => alumno.id), [1, 2]);
  });

  test('filtra por cicloEscolarId derivado', () => {
    alumnosService.createAlumno(datosAlumno());
    const alumnos = alumnosService.getAllAlumnos({ cicloEscolarId: 2 });
    assert.deepEqual(alumnos.map(alumno => alumno.matricula), ['CM-2026-006']);
  });

  test('rechaza grado y grupo libres como fuente académica', () => {
    assert.throws(
      () => alumnosService.createAlumno({ ...datosAlumno(), grado: '1° Secundaria' }),
      error => error.statusCode === 400 && /grupoId/i.test(error.message)
    );
  });

  test('importación inequívoca resuelve Grado y Grupo hacia grupoId', () => {
    const resultado = validarAlumnos([{
      matricula: 'CM-IMP-001',
      nombre: 'Alumno Importado',
      fechaNacimiento: '2015-01-10',
      grado: '1° Secundaria',
      grupo: 'Grupo A',
      cicloEscolarId: 2,
      tutor: 'Tutor Importado'
    }]);
    assert.equal(resultado.totalValidos, 1);
    assert.equal(resultado.validos[0].grupoId, 10);
    assert.equal(Object.hasOwn(resultado.validos[0], 'grado'), false);
    assert.equal(Object.hasOwn(resultado.validos[0], 'grupo'), false);
  });
});
