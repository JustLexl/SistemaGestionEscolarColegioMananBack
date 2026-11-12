const assert = require('node:assert/strict');

process.env.PORT = process.env.PORT || '3014';
const BASE_URL = `http://127.0.0.1:${process.env.PORT}/api`;

const gruposModel = require('../src/models/grupos.model');
const gradosModel = require('../src/models/grados.model');
const gradosService = require('../src/services/grados.service');
const gruposService = require('../src/services/grupos.service');
require('../index');

async function request(path, options = {}, expectedStatus = 200) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: options.body && !isFormData
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers
  });
  const rawBody = await response.text();
  let body = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Las plantillas se entregan como CSV.
  }
  assert.equal(
    response.status,
    expectedStatus,
    `${options.method || 'GET'} ${path}: ${response.status} ${JSON.stringify(body)}`
  );
  return body;
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

function payload(grupoIds = [10], overrides = {}) {
  return {
    codigo: 'E2E',
    nombre: 'Materia Demo E2E',
    claveSep: 'E2E-SEC-01',
    cargaHoraria: '4 hrs/sem',
    grupoIds,
    profesorId: 3,
    estado: 'Activa',
    isTroncoComun: true,
    ...overrides
  };
}

async function main() {
  await esperarServidor();

  const catalogo = await request('/materias');
  assert.equal(catalogo.data.length, 18);
  assert.deepEqual(catalogo.data[0].grupoIds, [1, 2]);
  assert.equal(catalogo.data[0].profesor.id, 1);
  assert.equal(catalogo.data[0].cicloEscolar.estado, 'Finalizado');

  gradosModel.grados.push({
    id: '70', nivel: 'Secundaria', numeroGrado: 2,
    nombre: '2° Secundaria', cicloEscolarId: 2
  });
  const segundoGrupoActivo = gruposModel.create({
    gradoId: '70', gradoNombre: '2° Secundaria', grupoLetra: 'A',
    nombre: '2° Secundaria - Grupo A', clave: 'CM-SEC-2A-E2E',
    profesorId: 3, profesorNombre: 'Prof. Roberto Carlos Valdés',
    profesorIniciales: 'RV', cedula: 'DOC-2021-095', estado: 'Activo'
  });

  const alta = await request('/materias', {
    method: 'POST', body: JSON.stringify(payload([10, segundoGrupoActivo.id]))
  }, 201);
  assert.deepEqual(alta.data.grupoIds, [10, segundoGrupoActivo.id]);
  assert.equal(alta.data.grados.length, 2);
  assert.equal(alta.data.cicloEscolar.nombre, '2026–2027');

  const consulta = await request(`/materias/${alta.data.id}`);
  assert.equal(consulta.data.profesor.cedula, 'DOC-2021-095');

  const profesorAnterior = await request('/profesores/3');
  assert.ok(profesorAnterior.data.materias.includes('Materia Demo E2E'));

  const reasignada = await request(`/materias/${alta.data.id}`, {
    method: 'PUT', body: JSON.stringify({ profesorId: 5 })
  });
  assert.equal(reasignada.data.profesor.id, 5);
  assert.equal((await request('/profesores/3')).data.materias.includes('Materia Demo E2E'), false);
  assert.ok((await request('/profesores/5')).data.materias.includes('Materia Demo E2E'));

  await request('/materias', {
    method: 'POST', body: JSON.stringify(payload([1], { claveSep: 'E2E-HIST-01' }))
  }, 409);
  await request('/materias', {
    method: 'POST', body: JSON.stringify(payload([10], { claveSep: 'E2E-INACT-01', profesorId: 6 }))
  }, 409);
  await request('/materias', {
    method: 'POST', body: JSON.stringify(payload([999], { claveSep: 'E2E-GRUPO-404' }))
  }, 404);
  await request('/materias', {
    method: 'POST', body: JSON.stringify(payload([10, 1], { claveSep: 'E2E-CROSS-01' }))
  }, 409);
  await request('/materias', {
    method: 'POST', body: JSON.stringify(payload([10], { claveSep: 'MAT-PRI-04' }))
  }, 409);

  await request('/materias/1', {
    method: 'PUT', body: JSON.stringify({ cargaHoraria: '8 hrs/sem' })
  }, 409);
  await request('/materias/1', { method: 'DELETE' }, 409);
  await request(`/materias/${alta.data.id}`, { method: 'DELETE' }, 409);

  const gradoPlaneado = gradosService.createGrado({
    nivel: 'Secundaria', numeroGrado: 1, cicloEscolarId: 3
  });
  const grupoPlaneado = gruposService.createGrupo({
    gradoId: gradoPlaneado.id, grupoLetra: 'A', profesorId: 3
  });
  const materiaPlaneada = await request('/materias', {
    method: 'POST', body: JSON.stringify(payload([grupoPlaneado.id], {
      claveSep: 'E2E-PLA-01', profesorId: null, estado: 'En planeacion'
    }))
  }, 201);
  assert.equal(materiaPlaneada.data.profesor, null);
  await request(`/materias/${materiaPlaneada.data.id}`, { method: 'DELETE' });

  const baja = await request(`/materias/${alta.data.id}/dar-de-baja`, {
    method: 'PATCH', body: JSON.stringify({})
  });
  assert.equal(baja.data.estado, 'Inactiva');
  assert.deepEqual(baja.data.grupoIds, [10, segundoGrupoActivo.id]);
  assert.equal(baja.data.profesor.id, 5);

  const plantilla = await request('/importacion/materias/plantilla');
  assert.match(plantilla, /cicloEscolarId/);
  assert.match(plantilla, /grupoIds/);

  const csv = [
    'codigo,nombre,claveSep,cargaHoraria,cicloEscolarId,grupoIds,gradoId,gruposAsignados,profesorId,estado,isTroncoComun',
    'IMP,Materia Importada E2E,IMP-E2E-01,2 hrs/sem,2,10,,,3,Activa,false'
  ].join('\r\n');
  const form = new FormData();
  form.append('archivo', new Blob([csv], { type: 'text/csv' }), 'materias.csv');
  const validacion = await request('/importacion/materias/validar', {
    method: 'POST', body: form
  });
  assert.equal(validacion.totalValidos, 1);
  const confirmacion = await request('/importacion/materias/confirmar', {
    method: 'POST', body: JSON.stringify({ validos: validacion.validos })
  }, 201);
  assert.equal(confirmacion.totalImportados, 1);
  assert.deepEqual(confirmacion.materias[0].grupoIds, [10]);

  const regresion = {};
  for (const modulo of [
    'health', 'alumnos', 'asistencias', 'roles', 'ciclos-escolares',
    'grados', 'grupos', 'materias', 'profesores', 'calificaciones'
  ]) {
    const respuesta = await request(`/${modulo}`);
    regresion[modulo] = respuesta.success ?? respuesta.status;
  }
  await request('/auth/login', {
    method: 'POST', body: JSON.stringify({ email: '', password: '' })
  }, 400);

  console.log(JSON.stringify({
    alta: {
      materiaId: alta.data.id,
      grupoIds: alta.data.grupoIds,
      grados: alta.data.grados.map(grado => grado.nombre),
      ciclo: alta.data.cicloEscolar.nombre
    },
    reasignacion: { profesorAnterior: 3, profesorNuevo: reasignada.data.profesor.id },
    baja: { estado: baja.data.estado, grupoIds: baja.data.grupoIds },
    importacion: confirmacion.totalImportados,
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
