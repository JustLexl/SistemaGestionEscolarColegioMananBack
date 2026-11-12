const assert = require('node:assert/strict');
const { after, before, beforeEach, describe, test } = require('node:test');
const express = require('express');
const XLSX = require('xlsx');

const plantillas = require('../src/config/importacion-plantillas');
const importacionRoutes = require('../src/routes/importacion.routes');
const alumnosModel = require('../src/models/alumnos.model');
const asistenciasModel = require('../src/models/asistencias.model');
const alumnosSeed = require('../src/data/alumnos.seed');
const asistenciasSeed = require('../src/data/asistencias.seed');
const {
  validarAlumnos,
  validarAsistencias,
  validarGrados,
  validarMaterias
} = require('../src/services/importacion.service');
const { convertirFecha, leerExcel } = require('../src/utils/excel.parser');

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function asistencia(overrides = {}) {
  return {
    matricula: 'CM-2026-001',
    fecha: '2026-11-12',
    estado: 'Presente',
    ...overrides
  };
}

function crearLibro(filas) {
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(filas), 'Datos');
  return XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

describe('Importación de asistencias', { concurrency: false }, () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/importacion', importacionRoutes);
    server = await new Promise(resolve => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}/api/importacion`;
  });

  after(() => new Promise(resolve => server.close(resolve)));

  beforeEach(() => {
    alumnosModel.alumnos.splice(0, alumnosModel.alumnos.length, ...clonar(alumnosSeed));
    asistenciasModel.asistencias.splice(
      0,
      asistenciasModel.asistencias.length,
      ...clonar(asistenciasSeed)
    );
  });

  for (const [entidad, encabezados] of Object.entries({
    alumnos: ['matricula', 'nombre', 'fechaNacimiento', 'grado', 'grupo', 'cicloEscolarId', 'tutor'],
    profesores: ['nombre', 'puesto', 'correo', 'cedula', 'estado'],
    grados: ['nivel', 'numeroGrado', 'cicloEscolarId'],
    grupos: ['gradoId', 'nombre', 'grupoLetra', 'clave', 'aula', 'edificio', 'turno', 'profesorId', 'alumnosMax', 'estado'],
    materias: ['codigo', 'nombre', 'claveSep', 'cargaHoraria', 'cicloEscolarId', 'grupoIds', 'gradoId', 'gruposAsignados', 'profesorId', 'estado', 'isTroncoComun'],
    asistencias: ['matricula', 'fecha', 'estado']
  })) {
    test(`mantiene una única plantilla oficial para ${entidad}`, () => {
      assert.deepEqual(plantillas[entidad], encabezados);
    });
  }

  test('valida una asistencia y resuelve matrícula hacia alumnoId', () => {
    const resultado = validarAsistencias([asistencia()]);
    assert.equal(resultado.totalValidos, 1);
    assert.deepEqual(resultado.validos[0], { ...asistencia(), alumnoId: 1 });
  });

  test('rechaza matrícula ausente', () => {
    const resultado = validarAsistencias([asistencia({ matricula: '' })]);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0].motivos.join(' '), /matricula/i);
  });

  test('rechaza una matrícula inexistente', () => {
    const resultado = validarAsistencias([asistencia({ matricula: 'CM-NO-EXISTE' })]);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0].motivos.join(' '), /No existe un alumno/i);
  });

  test('rechaza alumno inactivo', () => {
    const resultado = validarAsistencias([asistencia({ matricula: 'CM-2026-005' })]);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0].motivos.join(' '), /inactivos/i);
  });

  test('normaliza un serial de fecha de Excel', () => {
    const registros = leerExcel(crearLibro([
      ['matricula', 'fecha', 'estado'],
      ['CM-2026-001', 46338, 'Presente']
    ]));
    assert.equal(registros[0].fecha, '2026-11-12');
  });

  test('normaliza DD/MM/AAAA y conserva ISO', () => {
    const registros = leerExcel(crearLibro([
      ['matricula', 'fecha', 'estado'],
      ['CM-2026-002', '12/11/2026', 'Presente'],
      ['CM-2026-003', '2026-11-13', 'Presente']
    ]));
    assert.equal(registros[0].fecha, '2026-11-12');
    assert.equal(registros[1].fecha, '2026-11-13');
  });

  test('normaliza objetos Date', () => {
    assert.equal(convertirFecha(new Date('2026-11-14T00:00:00Z')), '2026-11-14');
  });

  test('rechaza una fecha inexistente', () => {
    const resultado = validarAsistencias([asistencia({ fecha: '2026-02-31' })]);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0].motivos.join(' '), /fecha/i);
  });

  test('rechaza estado inválido', () => {
    const resultado = validarAsistencias([asistencia({ estado: 'Retardo' })]);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0].motivos.join(' '), /Presente/);
  });

  test('detecta duplicados dentro del archivo', () => {
    const resultado = validarAsistencias([asistencia(), asistencia({ estado: 'Ausente' })]);
    assert.equal(resultado.totalValidos, 1);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0].motivos.join(' '), /archivo/i);
  });

  test('detecta duplicados contra el sistema', () => {
    const resultado = validarAsistencias([asistencia({ fecha: '2026-10-13' })]);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0].motivos.join(' '), /ya tiene/i);
  });

  test('revalida el formato canónico conservando matrícula y alumnoId', () => {
    const primera = validarAsistencias([asistencia()]);
    const segunda = validarAsistencias(primera.validos);
    assert.equal(segunda.totalValidos, 1);
    assert.equal(segunda.validos[0].alumnoId, 1);
  });

  test('confirma por HTTP únicamente registros válidos', async () => {
    const validos = validarAsistencias([asistencia()]).validos;
    const response = await fetch(`${baseUrl}/asistencias/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validos })
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.totalImportados, 1);
    assert.equal(asistenciasModel.findByAlumnoId(1)[0].fecha, '2026-11-12');
  });

  test('rechaza un archivo vacío', () => {
    const resultado = validarAsistencias([]);
    assert.equal(resultado.totalRegistros, 0);
    assert.equal(resultado.totalErrores, 1);
  });

  test('rechaza extensión distinta de xlsx o csv', async () => {
    const form = new FormData();
    form.append('archivo', new Blob(['datos']), 'asistencias.txt');
    const response = await fetch(`${baseUrl}/asistencias/validar`, { method: 'POST', body: form });
    assert.equal(response.status, 400);
    assert.match((await response.json()).mensaje, /Solo se permiten/);
  });

  test('responde 413 cuando el archivo supera 10 MB', async () => {
    const form = new FormData();
    form.append('archivo', new Blob([Buffer.alloc((10 * 1024 * 1024) + 1)]), 'asistencias.csv');
    const response = await fetch(`${baseUrl}/asistencias/validar`, { method: 'POST', body: form });
    assert.equal(response.status, 413);
    assert.match((await response.json()).mensaje, /10 MB/);
  });

  test('reporta columnas faltantes', () => {
    const resultado = validarAsistencias([{ matricula: 'CM-2026-001', fecha: '2026-11-12' }]);
    assert.equal(resultado.totalErrores, 1);
    assert.match(resultado.errores[0], /estado/);
  });

  test('conserva la importación válida de alumnos', () => {
    const resultado = validarAlumnos([{
      matricula: 'CM-IMP-025', nombre: 'Alumno Importado', fechaNacimiento: '2015-01-10',
      grado: '1° Secundaria', grupo: 'Grupo A', cicloEscolarId: 2, tutor: 'Tutor Demo'
    }]);
    assert.equal(resultado.totalValidos, 1);
  });

  test('conserva la importación válida de grados', () => {
    const resultado = validarGrados([{ nivel: 'Secundaria', numeroGrado: '3', cicloEscolarId: '3' }]);
    assert.equal(resultado.totalValidos, 1);
  });

  test('conserva la importación válida de materias', () => {
    const resultado = validarMaterias([{
      codigo: 'D25', nombre: 'Materia Demo 2.5', claveSep: 'D25-SEC-01',
      cargaHoraria: '2 hrs/sem', cicloEscolarId: '2', grupoIds: '10',
      gradoId: '', gruposAsignados: '', profesorId: '3', estado: 'Activa',
      isTroncoComun: 'false'
    }]);
    assert.equal(resultado.totalValidos, 1);
  });

  test('separa un lote mixto en dos válidos y dos errores', () => {
    const resultado = validarAsistencias([
      asistencia(),
      asistencia({ matricula: 'CM-2026-002', fecha: '2026-11-13', estado: 'Ausente' }),
      asistencia({ matricula: 'NO-EXISTE', fecha: '2026-11-14' }),
      asistencia({ matricula: 'CM-2026-005', fecha: '2026-11-15' })
    ]);
    assert.deepEqual(
      [resultado.totalRegistros, resultado.totalValidos, resultado.totalErrores],
      [4, 2, 2]
    );
  });
});
