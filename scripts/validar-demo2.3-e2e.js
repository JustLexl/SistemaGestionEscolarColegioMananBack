const assert = require('node:assert/strict');

process.env.PORT = process.env.PORT || '3013';
const BASE_URL = `http://127.0.0.1:${process.env.PORT}/api`;

const gruposModel = require('../src/models/grupos.model');
const gradosModel = require('../src/models/grados.model');
const ciclosModel = require('../src/models/ciclos-escolares.model');
require('../index');

async function request(path, options = {}, expectedStatus = 200) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers
  });
  const rawBody = await response.text();
  let body = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Las plantillas se entregan como CSV; el resto de endpoints usa JSON.
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

function payload(matricula = 'CM-E2E-2301', grupoId = 10) {
  return {
    matricula,
    nombre: 'Alumno Demo 2.3',
    fechaNacimiento: '2015-06-10',
    grupoId,
    tutor: 'Tutor Demo 2.3',
    estado: 'Activo'
  };
}

async function main() {
  await esperarServidor();

  const alumnosIniciales = await request('/alumnos');
  const sofia = alumnosIniciales.data.find(alumno => alumno.id === 1);
  assert.equal(sofia.grupoId, 1);
  assert.equal(sofia.grupo.grupoLetra, 'A');
  assert.equal(sofia.grado.nombre, '4° Primaria');
  assert.equal(sofia.cicloEscolar.nombre, '2024–2025');
  assert.equal(Object.hasOwn(sofia, 'grado') && typeof sofia.grado === 'string', false);

  const grupoMismoCiclo = gruposModel.create({
    gradoId: '7',
    gradoNombre: '1° Secundaria',
    grupoLetra: 'B',
    nombre: '1° Secundaria - Grupo B',
    clave: 'CM-SEC-1B-E2E',
    estado: 'Activo'
  });
  gradosModel.grados.push({
    id: '8', nivel: 'Secundaria', numeroGrado: 2,
    nombre: '2° Secundaria', cicloEscolarId: 3
  });
  const grupoPlaneacion = gruposModel.create({
    gradoId: '8', grupoLetra: 'A', clave: 'CM-SEC-2A-E2E', estado: 'Activo'
  });

  const alta = await request('/alumnos', {
    method: 'POST', body: JSON.stringify(payload())
  }, 201);
  assert.equal(alta.data.grupoId, 10);
  assert.equal(alta.data.grado.nombre, '1° Secundaria');
  assert.equal(alta.data.cicloEscolar.nombre, '2026–2027');

  await request('/alumnos', {
    method: 'POST', body: JSON.stringify(payload('CM-E2E-FINAL', 1))
  }, 409);
  await request('/alumnos', {
    method: 'POST', body: JSON.stringify(payload('CM-E2E-PLANEACION', grupoPlaneacion.id))
  }, 409);
  await request('/alumnos', {
    method: 'POST', body: JSON.stringify(payload('CM-E2E-NO-GRUPO', 9999))
  }, 404);

  const mismoCiclo = await request(`/alumnos/${alta.data.id}`, {
    method: 'PUT', body: JSON.stringify({ grupoId: grupoMismoCiclo.id })
  });
  assert.equal(mismoCiclo.data.grupoId, grupoMismoCiclo.id);

  ciclosModel.ciclos[2].fechaInicio = '2026-09-01';
  ciclosModel.ciclos[2].fechaFin = '2027-06-30';
  await request(`/alumnos/${alta.data.id}`, {
    method: 'PUT', body: JSON.stringify({ grupoId: grupoPlaneacion.id })
  }, 409);

  const historicoCorregido = await request('/alumnos/1', {
    method: 'PUT', body: JSON.stringify({ nombre: 'Sofía Hernández López' })
  });
  assert.equal(historicoCorregido.data.grupoId, 1);
  await request('/alumnos/1', {
    method: 'PUT', body: JSON.stringify({ grupoId: 10 })
  }, 409);

  const baja = await request(`/alumnos/${alta.data.id}/dar-de-baja`, {
    method: 'PATCH', body: JSON.stringify({})
  });
  assert.equal(baja.data.estado, 'Inactivo');
  assert.equal(baja.data.grupoId, grupoMismoCiclo.id);

  assert.equal((await request(`/alumnos?grupoId=${grupoMismoCiclo.id}`)).data.length, 1);
  assert.ok((await request('/alumnos?gradoId=4')).data.length >= 2);
  assert.ok((await request('/alumnos?cicloEscolarId=1')).data.length >= 5);

  const regresion = {};
  for (const modulo of [
    'health', 'alumnos', 'asistencias', 'roles', 'ciclos-escolares',
    'grados', 'grupos', 'materias', 'profesores', 'calificaciones'
  ]) {
    const respuesta = await request(`/${modulo}`);
    regresion[modulo] = respuesta.success ?? respuesta.status;
  }
  const plantillaAlumnos = await request('/importacion/alumnos/plantilla');
  assert.match(plantillaAlumnos, /cicloEscolarId/);
  await request('/auth/login', {
    method: 'POST', body: JSON.stringify({ email: '', password: '' })
  }, 400);

  console.log(JSON.stringify({
    legacy: {
      alumno: sofia.nombre,
      grupoId: sofia.grupoId,
      grado: sofia.grado.nombre,
      ciclo: sofia.cicloEscolar.nombre
    },
    altaActiva: {
      alumnoId: alta.data.id,
      grupoId: alta.data.grupoId,
      grado: alta.data.grado.nombre,
      ciclo: alta.data.cicloEscolar.nombre
    },
    reasignacionMismoCiclo: mismoCiclo.data.grupoId,
    bajaConGrupoId: baja.data.grupoId,
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
