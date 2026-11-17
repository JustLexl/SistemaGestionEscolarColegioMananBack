require('dotenv').config();
const assert = require('node:assert/strict');
const http = require('http');

const PORT = process.env.PORT || 3002;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

const results = [];

function recordTest(moduleName, operation, passed, detail = '') {
  results.push({
    Módulo: moduleName,
    Operación: operation,
    Estado: passed ? '✅ PASS' : '❌ FAIL',
    Detalle: detail
  });
}

async function request(path, options = {}, expectedStatus = 200) {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    Origin: 'http://localhost:4200',
    ...(options.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  const raw = await response.text();
  let body = raw;
  try {
    body = JSON.parse(raw);
  } catch {}

  assert.equal(
    response.status,
    expectedStatus,
    `${options.method || 'GET'} ${path}: esperado ${expectedStatus}, recibido ${response.status}. Respuesta: ${raw}`
  );

  return { status: response.status, headers: response.headers, body };
}

async function waitForServer(maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

async function runLocalScenario() {
  console.log('================================================================');
  console.log('   SUB-ESCENARIO DE PRUEBAS LOCALES - COLEGIO MANANTIAL BACKEND   ');
  console.log('================================================================');
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`Puerto asignado: ${PORT} (compatible con FrontColegioManantial y React)\n`);

  // 1. Health & CORS
  try {
    const health = await request('/health');
    const corsHeader = health.headers.get('access-control-allow-origin');
    const corsOk = corsHeader === '*' || corsHeader === 'http://localhost:4200';
    recordTest('Infraestructura', 'Health Check', health.body.status === 'ok', `status: ${health.body.status}`);
    recordTest('Infraestructura', 'CORS Frontend', corsOk, `Access-Control-Allow-Origin: ${corsHeader}`);
  } catch (err) {
    recordTest('Infraestructura', 'Health Check', false, err.message);
  }

  // 2. MongoDB Status
  try {
    const dbStatus = await request('/db/status');
    const isConn = dbStatus.body.database?.isConnected;
    recordTest('MongoDB Atlas', 'Conexión BD', isConn, `Host: ${dbStatus.body.database?.host}`);
    recordTest('MongoDB Atlas', 'Colecciones Sembradas', Object.keys(dbStatus.body.collections || {}).length >= 5, `Total colecciones: ${Object.keys(dbStatus.body.collections || {}).length}`);
  } catch (err) {
    recordTest('MongoDB Atlas', 'Conexión BD', false, err.message);
  }

  // 3. CRUD Roles y Usuarios
  let testRolId = null;
  try {
    const list = await request('/roles');
    recordTest('Roles', 'Listar Roles (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} roles`);

    const created = await request('/roles', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Usuario Prueba Local',
        puesto: 'Administrativo',
        correo: `prueba.local.${Date.now()}@manantial.edu.mx`,
        estado: 'Activo'
      })
    }, 201);
    testRolId = created.body.data?.id;
    recordTest('Roles', 'Crear Rol (POST)', !!testRolId, `ID: ${testRolId}`);

    const updated = await request(`/roles/${testRolId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: 'Usuario Prueba Modificado',
        puesto: 'Administrativo',
        correo: created.body.data.correo,
        estado: 'Activo'
      })
    });
    recordTest('Roles', 'Actualizar Rol (PUT)', updated.body.data?.nombre === 'Usuario Prueba Modificado', updated.body.data?.nombre);

    const toggled = await request(`/roles/${testRolId}/toggle-estado`, { method: 'PATCH' });
    recordTest('Roles', 'Toggle Estado (PATCH)', toggled.body.data?.estado === 'Inactivo', `Estado: ${toggled.body.data?.estado}`);

    await request(`/roles/${testRolId}`, { method: 'DELETE' }, 200);
    recordTest('Roles', 'Eliminar Rol (DELETE)', true, `ID eliminado: ${testRolId}`);
  } catch (err) {
    recordTest('Roles', 'Error CRUD', false, err.message);
  }

  // 4. CRUD Ciclos Escolares
  let testCicloId = null;
  try {
    const list = await request('/ciclos-escolares');
    recordTest('Ciclos Escolares', 'Listar Ciclos (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} ciclos`);

    const randomYear = 2030 + Math.floor(Math.random() * 50);
    const created = await request('/ciclos-escolares', {
      method: 'POST',
      body: JSON.stringify({
        nombre: `${randomYear}–${randomYear + 1}`,
        fechaInicio: `${randomYear}-08-25`,
        fechaFin: `${randomYear + 1}-07-10`
      })
    }, 201);
    testCicloId = created.body.data?.id;
    recordTest('Ciclos Escolares', 'Crear Ciclo (POST)', !!testCicloId, `ID: ${testCicloId}`);
  } catch (err) {
    recordTest('Ciclos Escolares', 'Error CRUD', false, err.message);
  }

  // 5. CRUD Grados
  let testGradoId = null;
  try {
    const list = await request('/grados');
    recordTest('Grados', 'Listar Grados (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} grados`);

    if (testCicloId) {
      const created = await request('/grados', {
        method: 'POST',
        body: JSON.stringify({
          nivel: 'Primaria',
          numeroGrado: 1,
          cicloEscolarId: testCicloId
        })
      }, 201);
      testGradoId = created.body.data?.id;
      recordTest('Grados', 'Crear Grado (POST)', !!testGradoId, `ID: ${testGradoId}`);
    }
  } catch (err) {
    recordTest('Grados', 'Error CRUD', false, err.message);
  }

  // 6. CRUD Grupos
  let testGrupoId = null;
  try {
    const list = await request('/grupos');
    recordTest('Grupos', 'Listar Grupos (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} grupos`);

    const metrics = await request('/grupos/metrics');
    recordTest('Grupos', 'Métricas de Grupos (GET)', typeof metrics.body.data?.total === 'number', `Total: ${metrics.body.data?.total}`);

    if (testGradoId) {
      const created = await request('/grupos', {
        method: 'POST',
        body: JSON.stringify({
          gradoId: testGradoId,
          grupoLetra: 'X',
          clave: `CM-PRI-TST-${Date.now()}`,
          aula: 'Aula 999',
          edificio: 'Edificio Norte',
          turno: 'matutino',
          alumnosMax: 35,
          estado: 'Activo'
        })
      }, 201);
      testGrupoId = created.body.data?.id;
      recordTest('Grupos', 'Crear Grupo (POST)', !!testGrupoId, `ID: ${testGrupoId}`);

      if (testGrupoId) {
        const updated = await request(`/grupos/${testGrupoId}`, {
          method: 'PUT',
          body: JSON.stringify({
            aula: 'Aula 888'
          })
        });
        recordTest('Grupos', 'Actualizar Grupo (PUT)', updated.body.data?.aula === 'Aula 888', updated.body.data?.aula);

        const toggled = await request(`/grupos/${testGrupoId}/toggle-estado`, { method: 'PATCH' });
        recordTest('Grupos', 'Toggle Estado (PATCH)', toggled.body.data?.estado === 'Inactivo', toggled.body.data?.estado);

        await request(`/grupos/${testGrupoId}`, { method: 'DELETE' }, 200);
        recordTest('Grupos', 'Eliminar Grupo (DELETE)', true, `ID eliminado: ${testGrupoId}`);
      }
    }
  } catch (err) {
    recordTest('Grupos', 'Error CRUD', false, err.message);
  }

  // 7. CRUD Materias
  let testMateriaId = null;
  try {
    const list = await request('/materias');
    recordTest('Materias', 'Listar Materias (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} materias`);

    const activeGroups = await request('/grupos?estado=Activo');
    const validGroup = activeGroups.body.data?.find(g => g.cicloEscolar?.estado === 'Activo') || activeGroups.body.data?.find(g => g.id === 10);

    if (validGroup) {
      const sepKey = `MAT-SEP-${Date.now()}`;
      const created = await request('/materias', {
        method: 'POST',
        body: JSON.stringify({
          codigo: 'TST',
          nombre: 'Materia Prueba Local',
          claveSep: sepKey,
          cargaHoraria: '3 hrs/sem',
          profesorId: validGroup.profesorId || 3,
          grupoIds: [validGroup.id]
        })
      }, 201);
      testMateriaId = created.body.data?.id;
      recordTest('Materias', 'Crear Materia (POST)', !!testMateriaId, `ID: ${testMateriaId}`);

      if (testMateriaId) {
        const updated = await request(`/materias/${testMateriaId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre: 'Materia Prueba Modificada',
            cargaHoraria: '4 hrs/sem'
          })
        });
        recordTest('Materias', 'Actualizar Materia (PUT)', updated.body.data?.nombre === 'Materia Prueba Modificada', updated.body.data?.nombre);

        const baja = await request(`/materias/${testMateriaId}/dar-de-baja`, { method: 'PATCH' });
        recordTest('Materias', 'Dar de Baja Materia (PATCH)', baja.body.data?.estado === 'Inactiva', baja.body.data?.estado);
      }
    }
  } catch (err) {
    recordTest('Materias', 'Error CRUD', false, err.message);
  }

  // 8. Profesores
  try {
    const list = await request('/profesores');
    recordTest('Profesores', 'Listar Profesores (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} profesores`);
  } catch (err) {
    recordTest('Profesores', 'Listar Profesores', false, err.message);
  }

  // 9. Alumnos
  let testAlumnoId = null;
  try {
    const list = await request('/alumnos');
    recordTest('Alumnos', 'Listar Alumnos (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} alumnos`);

    const activeGroups = await request('/grupos?estado=Activo');
    const validGroup = activeGroups.body.data?.find(g => g.cicloEscolar?.estado === 'Activo') || activeGroups.body.data?.find(g => g.id === 10);

    if (validGroup) {
      const matricula = `MAT-${Date.now().toString().slice(-6)}`;
      const created = await request('/alumnos', {
        method: 'POST',
        body: JSON.stringify({
          matricula,
          nombre: 'Alumno Prueba Local',
          fechaNacimiento: '2015-05-10',
          grupoId: validGroup.id,
          tutor: 'Tutor de Prueba',
          estado: 'Activo'
        })
      }, 201);
      testAlumnoId = created.body.data?.id;
      recordTest('Alumnos', 'Crear Alumno (POST)', !!testAlumnoId, `ID: ${testAlumnoId}`);

      if (testAlumnoId) {
        const updated = await request(`/alumnos/${testAlumnoId}`, {
          method: 'PUT',
          body: JSON.stringify({
            tutor: 'Tutor Modificado'
          })
        });
        recordTest('Alumnos', 'Actualizar Alumno (PUT)', updated.body.data?.tutor === 'Tutor Modificado', updated.body.data?.tutor);
      }
    }
  } catch (err) {
    recordTest('Alumnos', 'Error CRUD', false, err.message);
  }

  // 10. Asistencias
  try {
    const list = await request('/asistencias');
    recordTest('Asistencias', 'Listar Asistencias (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} asistencias`);
  } catch (err) {
    recordTest('Asistencias', 'Listar Asistencias', false, err.message);
  }

  // 11. Calificaciones
  try {
    const list = await request('/calificaciones');
    recordTest('Calificaciones', 'Listar Calificaciones (GET)', Array.isArray(list.body.data) && list.body.data.length > 0, `${list.body.data?.length} calificaciones`);
  } catch (err) {
    recordTest('Calificaciones', 'Listar Calificaciones', false, err.message);
  }

  // Reporte Final
  console.log('\n================================================================');
  console.log('              RESULTADOS DEL SUB-ESCENARIO LOCAL                ');
  console.log('================================================================');
  console.table(results);

  const total = results.length;
  const passed = results.filter(r => r.Estado.includes('PASS')).length;
  const failed = total - passed;

  console.log(`\nResumen: ${passed}/${total} pruebas pasaron exitosamente (${failed} fallidas).`);

  if (failed === 0) {
    console.log('\n🎉 ¡TODOS LOS CRUDS Y CONEXIONES ESTÁN FUNCIONANDO PERFECTAMENTE!');
    console.log('El backend está listo para recibir peticiones del Frontend actual (Angular) o subirlo a React.');
  } else {
    console.error(`\n⚠️ Se detectaron ${failed} fallos en el escenario local.`);
  }

  return failed === 0;
}

async function main() {
  const ready = await waitForServer(5);
  if (!ready) {
    console.log('Servidor no detectado en el puerto asignado. Iniciando instancia de prueba...');
    require('../index');
    await waitForServer(30);
  }

  const success = await runLocalScenario();
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('Error fatal al ejecutar pruebas locales:', err);
  process.exit(1);
});
