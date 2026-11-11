const assert = require('node:assert/strict');
const test = require('node:test');
const XLSX = require('xlsx');
const { leerExcel } = require('../src/utils/excel.parser');

function crearLibro(filas) {
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    libro,
    XLSX.utils.aoa_to_sheet(filas),
    'Datos',
  );
  return XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

test('convierte fechas numéricas de Excel a AAAA-MM-DD', () => {
  const registros = leerExcel(crearLibro([
    ['nombre', 'fechaNacimiento'],
    ['Alumno Excel', 45292],
  ]));

  assert.equal(registros[0].fechaNacimiento, '2024-01-01');
});

test('convierte DD/MM/AAAA y conserva fechas ISO', () => {
  const registros = leerExcel(crearLibro([
    ['nombre', 'fechaNacimiento'],
    ['Alumno Texto', '9/2/2014'],
    ['Alumno ISO', '2015-03-10'],
  ]));

  assert.equal(registros[0].fechaNacimiento, '2014-02-09');
  assert.equal(registros[1].fechaNacimiento, '2015-03-10');
});
