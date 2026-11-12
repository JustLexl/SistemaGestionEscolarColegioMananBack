const assert = require('node:assert/strict');

process.env.PORT = process.env.PORT || '3015';
const BASE_URL = `http://127.0.0.1:${process.env.PORT}/api`;
require('../index');

async function request(path, options = {}, expectedStatus = 200) {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: options.body && !isForm
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers
  });
  const raw = await response.text();
  let body = raw;
  try {
    body = JSON.parse(raw);
  } catch {
    // Las plantillas CSV se conservan como texto.
  }
  assert.equal(
    response.status,
    expectedStatus,
    `${options.method || 'GET'} ${path}: ${response.status} ${JSON.stringify(body)}`
  );
  return body;
}

function csvForm(lines, filename = 'asistencias.csv') {
  const form = new FormData();
  form.append('archivo', new Blob([lines.join('\r\n')], { type: 'text/csv' }), filename);
  return form;
}

async function validarCsv(lines) {
  return request('/importacion/asistencias/validar', {
    method: 'POST',
    body: csvForm(lines)
  });
}

async function esperarServidor() {
  for (let intento = 0; intento < 30; intento += 1) {
    try {
      await request('/health');
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  throw new Error('El backend no inició a tiempo.');
}

async function main() {
  await esperarServidor();

  const plantillas = {
    alumnos: 'matricula,nombre,fechaNacimiento,grado,grupo,cicloEscolarId,tutor',
    profesores: 'nombre,puesto,correo,cedula,estado',
    grados: 'nivel,numeroGrado,cicloEscolarId',
    grupos: 'gradoId,nombre,grupoLetra,clave,aula,edificio,turno,profesorId,alumnosMax,estado',
    materias: 'codigo,nombre,claveSep,cargaHoraria,cicloEscolarId,grupoIds,gradoId,gruposAsignados,profesorId,estado,isTroncoComun',
    asistencias: 'matricula,fecha,estado'
  };

  for (const [entidad, encabezados] of Object.entries(plantillas)) {
    const plantilla = await request(`/importacion/${entidad}/plantilla`);
    assert.equal(plantilla.replace(/^\uFEFF/, '').trim(), encabezados);
  }

  const validacion = await validarCsv([
    'matricula,fecha,estado',
    'CM-2026-001,12/11/2026,Presente'
  ]);
  assert.equal(validacion.totalValidos, 1);
  assert.equal(validacion.validos[0].fecha, '2026-11-12');
  assert.equal(validacion.validos[0].alumnoId, 1);

  const confirmacion = await request('/importacion/asistencias/confirmar', {
    method: 'POST',
    body: JSON.stringify({ validos: validacion.validos })
  }, 201);
  assert.equal(confirmacion.totalImportados, 1);

  const historial = await request('/asistencias/alumno/1');
  assert.equal(
    historial.data.filter(item => item.fecha === '2026-11-12').length,
    1
  );

  const repetida = await validarCsv([
    'matricula,fecha,estado',
    'CM-2026-001,12/11/2026,Ausente'
  ]);
  assert.equal(repetida.totalValidos, 0);
  assert.equal(repetida.totalErrores, 1);
  assert.match(repetida.errores[0].motivos.join(' '), /ya tiene/i);
  const historialSinDuplicar = await request('/asistencias/alumno/1');
  assert.equal(
    historialSinDuplicar.data.filter(item => item.fecha === '2026-11-12').length,
    1
  );

  const inactiva = await validarCsv([
    'matricula,fecha,estado',
    'CM-2026-005,13/11/2026,Presente'
  ]);
  assert.equal(inactiva.totalErrores, 1);
  assert.match(inactiva.errores[0].motivos.join(' '), /inactivos/i);

  const mixta = await validarCsv([
    'matricula,fecha,estado',
    'CM-2026-002,14/11/2026,Presente',
    'CM-2026-003,14/11/2026,Ausente',
    'CM-NO-EXISTE,14/11/2026,Presente',
    'CM-2026-005,14/11/2026,Justificada'
  ]);
  assert.deepEqual(
    [mixta.totalRegistros, mixta.totalValidos, mixta.totalErrores],
    [4, 2, 2]
  );
  const mixtaConfirmada = await request('/importacion/asistencias/confirmar', {
    method: 'POST',
    body: JSON.stringify({ validos: mixta.validos })
  }, 201);
  assert.equal(mixtaConfirmada.totalImportados, 2);

  const regresion = {};
  for (const modulo of [
    'health', 'alumnos', 'asistencias', 'roles', 'ciclos-escolares',
    'grados', 'grupos', 'materias', 'profesores', 'calificaciones'
  ]) {
    const respuesta = await request(`/${modulo}`);
    regresion[modulo] = respuesta.success ?? respuesta.status;
  }
  await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: '', password: '' })
  }, 400);

  console.log(JSON.stringify({
    plantillas: Object.keys(plantillas),
    asistenciaImportada: confirmacion.asistencias[0],
    duplicadoRechazado: repetida.totalErrores,
    alumnoInactivoRechazado: inactiva.totalErrores,
    loteMixto: {
      total: mixta.totalRegistros,
      validos: mixta.totalValidos,
      errores: mixta.totalErrores,
      importados: mixtaConfirmada.totalImportados
    },
    regresion
  }, null, 2));
}

main().then(
  () => process.exit(0),
  error => {
    console.error(error);
    process.exit(1);
  }
);
