const assert = require('node:assert/strict');
const { beforeEach, describe, test } = require('node:test');

const ciclosModel = require('../src/models/ciclos-escolares.model');
const gradosModel = require('../src/models/grados.model');
const gruposModel = require('../src/models/grupos.model');
const ciclosService = require('../src/services/ciclos-escolares.service');
const gradosService = require('../src/services/grados.service');
const gruposService = require('../src/services/grupos.service');
const { determinarEstadoCiclo } = require('../src/utils/ciclo-escolar');

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

const inicial = {
  ciclos: clonar(ciclosModel.ciclos),
  grados: clonar(gradosModel.grados),
  grupos: clonar(gruposModel.grupos)
};

beforeEach(() => {
  ciclosModel.ciclos.splice(0, ciclosModel.ciclos.length, ...clonar(inicial.ciclos));
  gradosModel.grados.splice(0, gradosModel.grados.length, ...clonar(inicial.grados));
  gruposModel.grupos.splice(0, gruposModel.grupos.length, ...clonar(inicial.grupos));
});

function crearGradoPlaneacion(numeroGrado = 1, nivel = 'Primaria', cicloEscolarId = 3) {
  return gradosService.createGrado({ nivel, numeroGrado, cicloEscolarId });
}

describe('Ciclos escolares, grados y grupos', { concurrency: false }, () => {
  test('calcula los tres estados exclusivamente a partir de fechas', () => {
    assert.equal(determinarEstadoCiclo('2027-01-01', '2027-12-31', '2026-11-11'), 'Planeacion');
    assert.equal(determinarEstadoCiclo('2026-01-01', '2026-12-31', '2026-11-11'), 'Activo');
    assert.equal(determinarEstadoCiclo('2025-01-01', '2025-12-31', '2026-11-11'), 'Finalizado');
  });

  test('expone las semillas finalizada, activa y en planeación', () => {
    assert.deepEqual(ciclosService.getAll().map(ciclo => ciclo.estado), [
      'Finalizado', 'Activo', 'Planeacion'
    ]);
  });

  test('consulta un ciclo por id', () => {
    assert.equal(ciclosService.getById(2).nombre, '2026–2027');
  });

  test('rechaza consultar un ciclo inexistente', () => {
    assert.throws(() => ciclosService.getById(999), error => error.statusCode === 404);
  });

  test('crea un ciclo futuro válido', () => {
    const ciclo = ciclosService.create({
      nombre: '2028–2029', fechaInicio: '2028-08-28', fechaFin: '2029-07-13'
    });
    assert.equal(ciclo.estado, 'Planeacion');
  });

  test('rechaza campos obligatorios ausentes', () => {
    assert.throws(
      () => ciclosService.create({ fechaInicio: '2028-08-28', fechaFin: '2029-07-13' }),
      error => error.statusCode === 400 && /nombre/i.test(error.message)
    );
  });

  test('rechaza fechas con formato inválido', () => {
    assert.throws(
      () => ciclosService.create({ nombre: 'Inválido', fechaInicio: '28/08/2028', fechaFin: '2029-07-13' }),
      error => error.statusCode === 400 && /formato/i.test(error.message)
    );
  });

  test('rechaza una fecha final anterior a la inicial', () => {
    assert.throws(
      () => ciclosService.create({ nombre: 'Inválido', fechaInicio: '2029-07-13', fechaFin: '2028-08-28' }),
      error => error.statusCode === 400 && /anterior/i.test(error.message)
    );
  });

  test('rechaza nombres de ciclo duplicados', () => {
    assert.throws(
      () => ciclosService.create({ nombre: '2027–2028', fechaInicio: '2028-08-28', fechaFin: '2029-07-13' }),
      error => error.statusCode === 409 && /nombre/i.test(error.message)
    );
  });

  test('rechaza periodos solapados', () => {
    assert.throws(
      () => ciclosService.create({ nombre: 'Solapado', fechaInicio: '2027-09-01', fechaFin: '2028-08-31' }),
      error => error.statusCode === 409 && /solapan/i.test(error.message)
    );
  });

  test('actualiza nombre y fechas de un ciclo en planeación', () => {
    const ciclo = ciclosService.update(3, {
      nombre: '2027–2028 Ajustado', fechaInicio: '2027-08-16', fechaFin: '2028-07-14'
    });
    assert.equal(ciclo.nombre, '2027–2028 Ajustado');
  });

  test('rechaza modificar un ciclo activo', () => {
    assert.throws(() => ciclosService.update(2, { nombre: 'No permitido' }), error => error.statusCode === 409);
  });

  test('rechaza modificar un ciclo finalizado', () => {
    assert.throws(() => ciclosService.update(1, { nombre: 'No permitido' }), error => error.statusCode === 409);
  });

  test('conserva los grados históricos vinculados al ciclo legado', () => {
    const grados = gradosService.getAllGrados({ cicloEscolarId: 1 });
    assert.equal(grados.length, 6);
    assert.ok(grados.every(grado => grado.ciclo === '2024–2025'));
  });

  test('crea un grado en planeación y deriva su nombre', () => {
    const grado = crearGradoPlaneacion(3, 'Secundaria');
    assert.equal(grado.nombre, '3° Secundaria');
  });

  test('rechaza crear grados en ciclo activo', () => {
    assert.throws(
      () => gradosService.createGrado({ nivel: 'Primaria', numeroGrado: 1, cicloEscolarId: 2 }),
      error => error.statusCode === 409 && /planeación/i.test(error.message)
    );
  });

  test('rechaza crear grados en ciclo finalizado', () => {
    assert.throws(
      () => gradosService.createGrado({ nivel: 'Secundaria', numeroGrado: 1, cicloEscolarId: 1 }),
      error => error.statusCode === 409 && /planeación/i.test(error.message)
    );
  });

  test('rechaza un grado duplicado por ciclo, nivel y número', () => {
    crearGradoPlaneacion(2, 'Secundaria');
    assert.throws(
      () => crearGradoPlaneacion(2, 'Secundaria'),
      error => error.statusCode === 409 && /existe/i.test(error.message)
    );
  });

  test('valida los rangos de Primaria y Secundaria', () => {
    assert.throws(
      () => crearGradoPlaneacion(7, 'Primaria'),
      error => error.statusCode === 400 && /entre 1 y 6/i.test(error.message)
    );
    assert.throws(
      () => crearGradoPlaneacion(4, 'Secundaria'),
      error => error.statusCode === 400 && /entre 1 y 3/i.test(error.message)
    );
  });

  test('permite corregir nivel o número de un grado activo sin cambiar de ciclo', () => {
    const grado = gradosService.updateGrado(7, { numeroGrado: 2 });
    assert.equal(grado.nombre, '2° Secundaria');
    assert.equal(grado.cicloEscolarId, 2);
  });

  test('impide cambiar el ciclo de un grado activo', () => {
    assert.throws(
      () => gradosService.updateGrado(7, { cicloEscolarId: 3 }),
      error => error.statusCode === 409 && /ciclo escolar/i.test(error.message)
    );
  });

  test('crea grupos solo para grados en planeación', () => {
    const grado = crearGradoPlaneacion();
    const grupo = gruposService.createGrupo({ gradoId: grado.id, grupoLetra: 'A', profesorId: 3 });
    assert.equal(grupo.cicloEscolar.estado, 'Planeacion');
  });

  test('rechaza crear grupos para un grado activo', () => {
    assert.throws(
      () => gruposService.createGrupo({ gradoId: 7, grupoLetra: 'B', profesorId: 3 }),
      error => error.statusCode === 409 && /planeación/i.test(error.message)
    );
  });

  test('permite editar aula y profesor de un grupo activo', () => {
    const grupo = gruposService.updateGrupo(10, { aula: 'Aula S-202', profesorId: 5 });
    assert.equal(grupo.aula, 'Aula S-202');
    assert.equal(grupo.profesorId, 5);
  });

  test('impide cambiar el grado de un grupo activo', () => {
    assert.throws(
      () => gruposService.updateGrupo(10, { gradoId: 1 }),
      error => error.statusCode === 409 && /grado/i.test(error.message)
    );
  });

  test('permite cambiar un grupo en planeación a otro grado del mismo ciclo', () => {
    const primero = crearGradoPlaneacion(1);
    const segundo = crearGradoPlaneacion(2);
    const grupo = gruposService.createGrupo({ gradoId: primero.id, grupoLetra: 'A', profesorId: 3 });
    const actualizado = gruposService.updateGrupo(grupo.id, { gradoId: segundo.id });
    assert.equal(actualizado.gradoId, segundo.id);
  });

  test('impide mover un grupo en planeación a otro ciclo', () => {
    const grado = crearGradoPlaneacion();
    const grupo = gruposService.createGrupo({ gradoId: grado.id, grupoLetra: 'A', profesorId: 3 });
    const ciclo = ciclosService.create({
      nombre: '2028–2029', fechaInicio: '2028-08-28', fechaFin: '2029-07-13'
    });
    const gradoOtroCiclo = crearGradoPlaneacion(1, 'Primaria', ciclo.id);
    assert.throws(
      () => gruposService.updateGrupo(grupo.id, { gradoId: gradoOtroCiclo.id }),
      error => error.statusCode === 409 && /mismo ciclo/i.test(error.message)
    );
  });

  test('trata los grupos de ciclos finalizados como solo lectura', () => {
    assert.throws(
      () => gruposService.updateGrupo(1, { aula: 'No permitido' }),
      error => error.statusCode === 409 && /solo lectura/i.test(error.message)
    );
  });
});
