const assert = require('node:assert/strict');
const { beforeEach, describe, test } = require('node:test');

const materiasModel = require('../src/models/materias.model');
const gruposModel = require('../src/models/grupos.model');
const gradosModel = require('../src/models/grados.model');
const profesoresModel = require('../src/models/profesores.model');
const materiasService = require('../src/services/materias.service');
const gruposService = require('../src/services/grupos.service');
const gradosService = require('../src/services/grados.service');
const profesoresService = require('../src/services/profesores.service');
const { validarMaterias } = require('../src/services/importacion.service');

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

const inicial = {
  materias: clonar(materiasModel.materias),
  grupos: clonar(gruposModel.grupos),
  grados: clonar(gradosModel.grados),
  profesores: clonar(profesoresModel.profesores)
};

beforeEach(() => {
  materiasModel.materias.splice(0, materiasModel.materias.length, ...clonar(inicial.materias));
  gruposModel.grupos.splice(0, gruposModel.grupos.length, ...clonar(inicial.grupos));
  gradosModel.grados.splice(0, gradosModel.grados.length, ...clonar(inicial.grados));
  profesoresModel.profesores.splice(0, profesoresModel.profesores.length, ...clonar(inicial.profesores));
});

function payload(grupoIds = [10], overrides = {}) {
  return {
    codigo: 'DEM',
    nombre: 'Materia Demo',
    claveSep: 'DEM-SEC-01',
    cargaHoraria: '4 hrs/sem',
    grupoIds,
    profesorId: 3,
    estado: 'Activa',
    isTroncoComun: true,
    ...overrides
  };
}

function crearEstructuraPlaneacion() {
  const grado1 = gradosService.createGrado({ nivel: 'Secundaria', numeroGrado: 1, cicloEscolarId: 3 });
  const grado2 = gradosService.createGrado({ nivel: 'Secundaria', numeroGrado: 2, cicloEscolarId: 3 });
  const grupo1 = gruposService.createGrupo({ gradoId: grado1.id, grupoLetra: 'A', profesorId: 3 });
  const grupo2 = gruposService.createGrupo({ gradoId: grado2.id, grupoLetra: 'A', profesorId: 3 });
  return { grado1, grado2, grupo1, grupo2 };
}

function agregarSegundoGrupoActivo() {
  gradosModel.grados.push({
    id: '70', nivel: 'Secundaria', numeroGrado: 2,
    nombre: '2° Secundaria', cicloEscolarId: 2
  });
  gruposModel.grupos.push({
    id: 70, gradoId: '70', gradoNombre: '2° Secundaria', grupoLetra: 'A',
    nombre: '2° Secundaria - Grupo A', clave: 'CM-SEC-2A-26', aula: 'S-201',
    edificio: 'Secundaria', turno: 'matutino', profesorId: 3,
    profesorNombre: 'Prof. Roberto Carlos Valdés', profesorIniciales: 'RV',
    cedula: 'DOC-2021-095', materias: [], alumnosActuales: 0,
    alumnosMax: 35, estado: 'Activo', isBase: false
  });
  return 70;
}

describe('Materias con relaciones académicas reales', { concurrency: false }, () => {
  test('GET lógico devuelve las 18 materias históricas', () => {
    assert.equal(materiasService.getAllMaterias({}).length, 18);
  });

  test('GET individual devuelve la materia solicitada', () => {
    assert.equal(materiasService.getMateriaById(1).claveSep, 'MAT-PRI-04');
  });

  test('serializa el Profesor real y su cédula', () => {
    const materia = materiasService.getMateriaById(1);
    assert.equal(materia.profesor.nombre, profesoresModel.findById(1).nombre);
    assert.equal(materia.profesor.cedula, profesoresModel.findById(1).cedula);
  });

  test('serializa Grupos reales desde grupoIds', () => {
    const materia = materiasService.getMateriaById(1);
    assert.deepEqual(materia.grupos.map(grupo => grupo.id), [1, 2]);
  });

  test('deriva Grados sin duplicarlos', () => {
    const materia = materiasService.getMateriaById(1);
    assert.deepEqual(materia.grados.map(grado => grado.id), ['4']);
  });

  test('deriva el CicloEscolar desde los Grupos', () => {
    assert.equal(materiasService.getMateriaById(1).cicloEscolar.nombre, '2024–2025');
  });

  test('crea Materia en ciclo Activo', () => {
    const creada = materiasService.createMateria(payload());
    assert.equal(creada.cicloEscolar.estado, 'Activo');
  });

  test('crea Materia en Planeación y permite profesor null', () => {
    const { grupo1 } = crearEstructuraPlaneacion();
    const creada = materiasService.createMateria(payload([grupo1.id], {
      claveSep: 'DEM-PLA-01', profesorId: null, estado: 'En planeación'
    }));
    assert.equal(creada.cicloEscolar.estado, 'Planeacion');
    assert.equal(creada.profesor, null);
  });

  test('rechaza crear Materia en ciclo Finalizado', () => {
    assert.throws(() => materiasService.createMateria(payload([1])), error =>
      error.statusCode === 409 && /finalizado/i.test(error.message));
  });

  test('reporta grupo inexistente con 404', () => {
    assert.throws(() => materiasService.createMateria(payload([999])), error =>
      error.statusCode === 404 && /grupo/i.test(error.message));
  });

  test('rechaza grupoIds inválido o duplicado', () => {
    assert.throws(() => materiasService.createMateria(payload('10')), error => error.statusCode === 400);
    assert.throws(() => materiasService.createMateria(payload([10, 10])), error => error.statusCode === 400);
  });

  test('rechaza Grupos de ciclos distintos', () => {
    const { grupo1 } = crearEstructuraPlaneacion();
    assert.throws(() => materiasService.createMateria(payload([10, grupo1.id])), error =>
      error.statusCode === 409 && /mismo ciclo/i.test(error.message));
  });

  test('reporta Profesor inexistente con 404', () => {
    assert.throws(() => materiasService.createMateria(payload([10], { profesorId: 999 })), error =>
      error.statusCode === 404 && /profesor/i.test(error.message));
  });

  test('rechaza Profesor inactivo con 409', () => {
    assert.throws(() => materiasService.createMateria(payload([10], { profesorId: 6 })), error =>
      error.statusCode === 409 && /inactivo/i.test(error.message));
  });

  test('rechaza clave SEP duplicada y permite conservar la propia al editar', () => {
    assert.throws(() => materiasService.createMateria(payload([10], { claveSep: 'MAT-PRI-04' })), error =>
      error.statusCode === 409);
    const creada = materiasService.createMateria(payload());
    const editada = materiasService.updateMateria(creada.id, { cargaHoraria: '5 hrs/sem' });
    assert.equal(editada.claveSep, 'DEM-SEC-01');
  });

  test('acepta una Materia multi-grado dentro del mismo ciclo', () => {
    const segundoGrupoId = agregarSegundoGrupoActivo();
    const creada = materiasService.createMateria(payload([10, segundoGrupoId]));
    assert.equal(creada.grados.length, 2);
  });

  test('reasignar Profesor actualiza la relación derivada', () => {
    const creada = materiasService.createMateria(payload());
    assert.ok(profesoresService.getProfesorById(3).materias.includes('Materia Demo'));
    materiasService.updateMateria(creada.id, { profesorId: 5 });
    assert.equal(profesoresService.getProfesorById(3).materias.includes('Materia Demo'), false);
    assert.ok(profesoresService.getProfesorById(5).materias.includes('Materia Demo'));
  });

  test('edita una Materia Activa sin cambiar sus Grupos', () => {
    const creada = materiasService.createMateria(payload());
    const editada = materiasService.updateMateria(creada.id, {
      cargaHoraria: '6 hrs/sem', profesorId: 5, grupoIds: [10]
    });
    assert.equal(editada.cargaHoraria, '6 hrs/sem');
  });

  test('rechaza mover una Materia Activa a otro ciclo', () => {
    const creada = materiasService.createMateria(payload());
    const { grupo1 } = crearEstructuraPlaneacion();
    assert.throws(() => materiasService.updateMateria(creada.id, { grupoIds: [grupo1.id] }), error =>
      error.statusCode === 409);
  });

  test('bloquea la edición de una Materia histórica', () => {
    assert.throws(() => materiasService.updateMateria(1, { cargaHoraria: '8 hrs/sem' }), error =>
      error.statusCode === 409 && /solo lectura/i.test(error.message));
  });

  test('dar de baja conserva todas las relaciones', () => {
    const creada = materiasService.createMateria(payload());
    const baja = materiasService.darDeBajaMateria(creada.id);
    assert.equal(baja.estado, 'Inactiva');
    assert.deepEqual(baja.grupoIds, [10]);
    assert.equal(baja.profesorId, 3);
  });

  test('elimina físicamente una Materia de Planeación', () => {
    const { grupo1 } = crearEstructuraPlaneacion();
    const creada = materiasService.createMateria(payload([grupo1.id], {
      claveSep: 'DEM-PLA-02', profesorId: null
    }));
    assert.equal(materiasService.deleteMateria(creada.id), true);
  });

  test('rechaza DELETE en ciclo Activo', () => {
    const creada = materiasService.createMateria(payload());
    assert.throws(() => materiasService.deleteMateria(creada.id), error => error.statusCode === 409);
  });

  test('rechaza DELETE histórico', () => {
    assert.throws(() => materiasService.deleteMateria(1), error => error.statusCode === 409);
  });

  test('findByProfesorId continúa alimentando Profesor → Materias', () => {
    assert.ok(materiasModel.findByProfesorId(3).every(materia => materia.profesorId === 3));
    assert.ok(profesoresService.getProfesorById(3).materias.includes('Matemáticas III'));
  });

  test('calcula métricas desde relaciones reales, sin alumnos simulados', () => {
    const metricas = materiasService.getMateriasMetrics({ cicloEscolarId: 1 });
    assert.equal(metricas.total, 18);
    assert.ok(metricas.gruposConMaterias > 0);
    assert.equal(Object.prototype.hasOwnProperty.call(metricas, 'totalImpactados'), false);
  });

  test('importación nueva usa grupoIds y no persiste gruposAsignados', () => {
    const resultado = validarMaterias([{
      codigo: 'IMP', nombre: 'Importada', claveSep: 'IMP-SEC-01',
      cargaHoraria: '2 hrs/sem', grupoIds: '10', gradoId: '', gruposAsignados: '',
      cicloEscolarId: '2', profesorId: '3', estado: 'Activa', isTroncoComun: 'false'
    }]);
    assert.equal(resultado.totalValidos, 1);
    assert.deepEqual(resultado.validos[0].grupoIds, [10]);
    assert.equal(Object.prototype.hasOwnProperty.call(resultado.validos[0], 'gruposAsignados'), false);
  });

  test('importación legacy exige contexto de ciclo', () => {
    const resultado = validarMaterias([{
      codigo: 'IMP', nombre: 'Importada Legacy', claveSep: 'IMP-LEG-01',
      cargaHoraria: '2 hrs/sem', gradoId: '7', gruposAsignados: '1° A',
      profesorId: '3', estado: 'Activa', isTroncoComun: 'false'
    }]);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0].motivos[0], /cicloEscolarId/i);
  });
});
