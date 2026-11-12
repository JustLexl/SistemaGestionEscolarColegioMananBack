const assert = require('node:assert/strict');
const { beforeEach, describe, test } = require('node:test');

const gradosModel = require('../src/models/grados.model');
const gruposModel = require('../src/models/grupos.model');
const materiasModel = require('../src/models/materias.model');
const profesoresModel = require('../src/models/profesores.model');
const gradosService = require('../src/services/grados.service');
const gruposService = require('../src/services/grupos.service');
const profesoresService = require('../src/services/profesores.service');

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

const estadoInicial = {
  grados: clonar(gradosModel.grados),
  grupos: clonar(gruposModel.grupos),
  materias: clonar(materiasModel.materias),
  profesores: clonar(profesoresModel.profesores)
};

beforeEach(() => {
  gradosModel.grados.splice(0, gradosModel.grados.length, ...clonar(estadoInicial.grados));
  gruposModel.grupos.splice(0, gruposModel.grupos.length, ...clonar(estadoInicial.grupos));
  materiasModel.materias.splice(0, materiasModel.materias.length, ...clonar(estadoInicial.materias));
  profesoresModel.profesores.splice(
    0,
    profesoresModel.profesores.length,
    ...clonar(estadoInicial.profesores)
  );
});

function crearGradoPlaneacion(numeroGrado = 1) {
  return gradosService.createGrado({
    nivel: 'Secundaria',
    numeroGrado,
    cicloEscolarId: 3
  });
}

describe('relaciones académicas de Grados, Grupos y Profesores', { concurrency: false }, () => {
  test('crea un grupo con un Profesor activo y guarda Profesor.id', () => {
    const grado = crearGradoPlaneacion();
    const grupo = gruposService.createGrupo({
      gradoId: grado.id,
      grupoLetra: 'Z',
      clave: 'CM-PRI-6Z-26',
      aula: 'Aula Demo',
      edificio: 'Edificio Demo',
      turno: 'matutino',
      profesorId: 3,
      alumnosMax: 35
    });

    assert.equal(grupo.profesorId, 3);
    assert.equal(grupo.profesorNombre, profesoresModel.findById(3).nombre);
    assert.equal(grupo.cedula, profesoresModel.findById(3).cedula);
  });

  test('Profesor devuelve automáticamente el Grupo asignado', () => {
    const grado = crearGradoPlaneacion();
    gruposService.createGrupo({
      gradoId: grado.id,
      grupoLetra: 'Z',
      clave: 'CM-PRI-6Z-26',
      profesorId: 3
    });

    assert.ok(profesoresService.getProfesorById(3).grupos.includes('1° Secundaria Z'));
  });

  test('reasignar un Grupo cambia la asignación entre Profesores', () => {
    const grado = crearGradoPlaneacion();
    const grupo = gruposService.createGrupo({
      gradoId: grado.id,
      grupoLetra: 'Z',
      clave: 'CM-PRI-6Z-26',
      profesorId: 3
    });

    gruposService.updateGrupo(grupo.id, { profesorId: 5 });

    assert.equal(profesoresService.getProfesorById(3).grupos.includes('1° Secundaria Z'), false);
    assert.equal(profesoresService.getProfesorById(5).grupos.includes('1° Secundaria Z'), true);
  });

  test('rechaza asignar un Profesor inactivo', () => {
    const grado = crearGradoPlaneacion();
    assert.throws(
      () => gruposService.createGrupo({
        gradoId: grado.id,
        grupoLetra: 'Z',
        clave: 'CM-PRI-6Z-26',
        profesorId: 6
      }),
      error => error.statusCode === 409 && /inactivo/i.test(error.message)
    );
  });

  test('rechaza un grado inexistente y evita grupos huérfanos', () => {
    assert.throws(
      () => gruposService.createGrupo({
        gradoId: '999',
        grupoLetra: 'Z',
        profesorId: 3
      }),
      error => error.statusCode === 404 && /grado/i.test(error.message)
    );
  });

  test('rechaza el mismo Grado y Grupo duplicado', () => {
    const grado = crearGradoPlaneacion();
    gruposService.createGrupo({
      gradoId: grado.id,
      grupoLetra: 'Z',
      clave: 'CM-SEC-1Z-28',
      profesorId: 3
    });
    assert.throws(
      () => gruposService.createGrupo({
        gradoId: grado.id,
        grupoLetra: 'Z',
        clave: 'CM-OTRA-CLAVE',
        profesorId: 3
      }),
      error => error.statusCode === 409 && /grado y letra/i.test(error.message)
    );
  });

  test('rechaza una clave de Grupo duplicada', () => {
    const grado = crearGradoPlaneacion();
    assert.throws(
      () => gruposService.createGrupo({
        gradoId: grado.id,
        grupoLetra: 'Z',
        clave: 'CM-PRI-4A-24',
        profesorId: 3
      }),
      error => error.statusCode === 409 && /clave/i.test(error.message)
    );
  });

  test('Profesor devuelve Materias calculadas por materia.profesorId', () => {
    const profesor = profesoresService.getProfesorById(3);

    assert.deepEqual(profesor.materias, [
      'Inglés Bilingüe (Cambridge)',
      'Matemáticas III',
      'Lengua Materna (Español III)'
    ]);
  });

  test('Profesor nuevo sin asignaciones devuelve arreglos vacíos', () => {
    const creado = profesoresModel.create({
      usuarioId: 999,
      nombre: 'Profesor Sin Asignaciones',
      cedula: 'DOC-SIN-ASIGNACIONES-001',
      estado: 'Activo'
    });
    const profesor = profesoresService.getProfesorById(creado.id);

    assert.deepEqual(profesor.grupos, []);
    assert.deepEqual(profesor.materias, []);
  });

  test('crea y edita un Grado usando los campos soportados', () => {
    const creado = gradosService.createGrado({
      nivel: 'Secundaria',
      numeroGrado: 2,
      cicloEscolarId: 3
    });
    const actualizado = gradosService.updateGrado(creado.id, {
      numeroGrado: 3
    });

    assert.equal(actualizado.nombre, '3° Secundaria');
    assert.equal(actualizado.nivel, 'Secundaria');
    assert.equal(actualizado.ciclo, '2027–2028');
  });
});
