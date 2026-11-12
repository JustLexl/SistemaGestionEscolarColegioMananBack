const assert = require('node:assert/strict');
const XLSX = require('xlsx');

const BASE_URL = process.env.DEMO2_API_URL || 'http://127.0.0.1:3001/api';

async function request(path, options = {}, expectedStatus = 200) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
  });
  const rawBody = await response.text();
  let body = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Las plantillas CSV se conservan como texto; las APIs JSON se analizan arriba.
  }
  assert.equal(
    response.status,
    expectedStatus,
    `${options.method || 'GET'} ${path}: se esperaba ${expectedStatus} y se recibió ${response.status}: ${JSON.stringify(body)}`,
  );
  return body;
}

async function validarArchivo(entidad, contenido, nombre, expectedStatus = 200) {
  const form = new FormData();
  form.append('archivo', new Blob([contenido]), nombre);
  return request(`/importacion/${entidad}/validar`, { method: 'POST', body: form }, expectedStatus);
}

async function validarCsv(csv, nombre = 'profesores.csv') {
  return validarArchivo('profesores', csv, nombre);
}

function crearXlsx(filas) {
  const libro = XLSX.utils.book_new();
  const hoja = XLSX.utils.aoa_to_sheet(filas);
  XLSX.utils.book_append_sheet(libro, hoja, 'Datos');
  return XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

async function main() {
  const profesoresAntes = await request('/profesores');
  assert.equal(
    profesoresAntes.data.some(profesor => profesor.nombre === 'Profesor Relación Demo'),
    false,
  );

  const altaProfesor = await request('/roles', {
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Profesor Relación Demo',
      correo: 'profesor.relacion.grupos.demo@manantial.edu.mx',
      puesto: 'Profesores',
      cedula: 'DOC-DEMO-GRUPOS-001',
      estado: 'Activo',
    }),
  }, 201);
  assert.equal(altaProfesor.profesor.usuarioId, altaProfesor.data.id);
  assert.notEqual(altaProfesor.profesor.id, altaProfesor.data.id);

  const gradoCreado = await request('/grados', {
    method: 'POST',
    body: JSON.stringify({
      nivel: 'Secundaria',
      numeroGrado: 1,
      cicloEscolarId: 3,
    }),
  }, 201);
  const gradoEditado = await request(`/grados/${gradoCreado.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ numeroGrado: 2 }),
  });
  assert.equal(gradoEditado.data.nombre, '2° Secundaria');

  const grupoCreado = await request('/grupos', {
    method: 'POST',
    body: JSON.stringify({
      gradoId: gradoCreado.data.id,
      grupoLetra: 'Z',
      clave: 'CM-SEC-DEMO-Z-26',
      aula: 'Aula Demo 21',
      edificio: 'Edificio Demo',
      turno: 'matutino',
      profesorId: altaProfesor.profesor.id,
      alumnosMax: 35,
      estado: 'Activo',
    }),
  }, 201);
  assert.equal(grupoCreado.data.profesorId, altaProfesor.profesor.id);
  const etiquetaGrupo = `${gradoEditado.data.nombre} Z`;

  const profesorConGrupo = await request(`/profesores/${altaProfesor.profesor.id}`);
  assert.ok(profesorConGrupo.data.grupos.includes(etiquetaGrupo));
  assert.deepEqual(profesorConGrupo.data.materias, []);

  const profesorDestinoId = 3;
  const grupoReasignado = await request(`/grupos/${grupoCreado.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ profesorId: profesorDestinoId }),
  });
  assert.equal(grupoReasignado.data.profesorId, profesorDestinoId);

  const profesorAnterior = await request(`/profesores/${altaProfesor.profesor.id}`);
  const profesorDestino = await request(`/profesores/${profesorDestinoId}`);
  assert.equal(profesorAnterior.data.grupos.includes(etiquetaGrupo), false);
  assert.equal(profesorDestino.data.grupos.includes(etiquetaGrupo), true);
  assert.ok(profesorDestino.data.materias.includes('Matemáticas III'));

  const profesorInactivo = await request(`/grupos/${grupoCreado.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ profesorId: 6 }),
  }, 409);
  assert.match(profesorInactivo.error, /inactivo/i);

  const gradoInexistente = await request('/grupos', {
    method: 'POST',
    body: JSON.stringify({ gradoId: '999', grupoLetra: 'Z', profesorId: 3 }),
  }, 404);
  assert.match(gradoInexistente.error, /grado/i);

  const grupoDuplicado = await request('/grupos', {
    method: 'POST',
    body: JSON.stringify({
      gradoId: gradoCreado.data.id,
      grupoLetra: 'Z',
      clave: 'CM-SEC-DEMO-OTRA-26',
      profesorId: 3,
    }),
  }, 409);
  assert.match(grupoDuplicado.error, /grado y letra/i);

  const claveDuplicada = await request('/grupos', {
    method: 'POST',
    body: JSON.stringify({
      gradoId: gradoCreado.data.id,
      grupoLetra: 'Y',
      clave: 'CM-SEC-DEMO-Z-26',
      profesorId: 3,
    }),
  }, 409);
  assert.match(claveDuplicada.error, /clave/i);

  const grupoInactivo = await request(`/grupos/${grupoCreado.data.id}/toggle-estado`, {
    method: 'PATCH',
  });
  assert.equal(grupoInactivo.data.estado, 'Inactivo');

  const altaDirectivo = await request('/roles', {
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Usuario Directivo Demo',
      correo: 'usuario.directivo.demo@manantial.edu.mx',
      puesto: 'Directivos',
      estado: 'Activo',
    }),
  }, 201);
  assert.equal(altaDirectivo.profesor, null);

  const altaAdministrativo = await request('/roles', {
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Usuario Administrativo Demo',
      correo: 'usuario.administrativo.demo@manantial.edu.mx',
      puesto: 'Administrativo',
      estado: 'Activo',
    }),
  }, 201);
  assert.equal(altaAdministrativo.profesor, null);

  const usuarioCambio = await request('/roles', {
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Usuario Cambio Rol Demo',
      correo: 'usuario.cambio.rol.demo@manantial.edu.mx',
      puesto: 'Administrativo',
      estado: 'Activo',
    }),
  }, 201);
  const cambioProfesor = await request(`/roles/${usuarioCambio.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ puesto: 'Profesores', cedula: 'DOC-CAMBIO-ROL-001' }),
  });
  const perfilCambioId = cambioProfesor.profesor.id;
  assert.equal(cambioProfesor.profesor.estado, 'Activo');

  const cambioDirectivo = await request(`/roles/${usuarioCambio.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ puesto: 'Directivos' }),
  });
  assert.equal(cambioDirectivo.profesor.id, perfilCambioId);
  assert.equal(cambioDirectivo.profesor.estado, 'Inactivo');

  const reactivado = await request(`/roles/${usuarioCambio.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ puesto: 'Profesores' }),
  });
  assert.equal(reactivado.profesor.id, perfilCambioId);
  assert.equal(reactivado.profesor.estado, 'Activo');

  const inactivo = await request(`/roles/${usuarioCambio.data.id}/toggle-estado`, {
    method: 'PATCH',
  });
  assert.equal(inactivo.data.estado, 'Inactivo');
  assert.equal(inactivo.profesor.estado, 'Inactivo');
  const activo = await request(`/roles/${usuarioCambio.data.id}/toggle-estado`, {
    method: 'PATCH',
  });
  assert.equal(activo.data.estado, 'Activo');
  assert.equal(activo.profesor.estado, 'Activo');

  const renombrado = await request(`/roles/${usuarioCambio.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ nombre: 'Profesor Nombre Sincronizado Demo' }),
  });
  assert.equal(renombrado.profesor.nombre, 'Profesor Nombre Sincronizado Demo');

  const csvValido = [
    'nombre,puesto,correo,cedula,estado',
    'Profesor Importado Demo,Profesores,profesor.importado.demo@manantial.edu.mx,DOC-IMPORT-DEMO-001,Activo',
  ].join('\n');
  const validacion = await validarCsv(csvValido);
  assert.equal(validacion.totalValidos, 1);
  assert.equal(validacion.totalErrores, 0);
  const importacion = await request('/importacion/profesores/confirmar', {
    method: 'POST',
    body: JSON.stringify({ validos: validacion.validos }),
  }, 201);
  const profesorImportado = importacion.profesores[0];
  assert.equal(profesorImportado.profesor.usuarioId, profesorImportado.usuario.id);

  const xlsxProfesor = crearXlsx([
    ['nombre', 'puesto', 'correo', 'cedula', 'estado'],
    [
      'Profesor XLSX Validación',
      'Profesores',
      'profesor.xlsx.validacion@manantial.edu.mx',
      'DOC-XLSX-VALID-001',
      'Activo',
    ],
  ]);
  const validacionXlsx = await validarArchivo(
    'profesores',
    xlsxProfesor,
    'profesor-valido.xlsx',
  );
  assert.equal(validacionXlsx.totalValidos, 1);
  assert.equal(validacionXlsx.totalErrores, 0);

  const xlsxFecha = crearXlsx([
    ['matricula', 'nombre', 'fechaNacimiento', 'grado', 'grupo', 'cicloEscolarId', 'tutor'],
    ['CM-FECHA-DEMO-001', 'Alumno Fecha Demo', 45292, '1° Secundaria', 'Grupo A', 2, 'Tutor Demo'],
  ]);
  const validacionFecha = await validarArchivo(
    'alumnos',
    xlsxFecha,
    'alumno-fecha.xlsx',
  );
  assert.equal(validacionFecha.totalValidos, 1);
  assert.equal(validacionFecha.validos[0].fechaNacimiento, '2024-01-01');

  const archivoExcedido = await validarArchivo(
    'profesores',
    new Uint8Array((10 * 1024 * 1024) + 1),
    'profesores-mayor-10mb.csv',
    413,
  );
  assert.equal(archivoExcedido.success, false);
  assert.match(archivoExcedido.mensaje, /10 MB/);

  const invalidas = {
    sinCedula: await validarCsv([
      'nombre,puesto,correo,cedula,estado',
      'Profesor Sin Cedula,Profesores,sin.cedula.demo@manantial.edu.mx,,Activo',
    ].join('\n')),
    cedulaDuplicada: await validarCsv([
      'nombre,puesto,correo,cedula,estado',
      'Profesor Cedula Duplicada,Profesores,cedula.duplicada.demo@manantial.edu.mx,DOC-2019-018,Activo',
    ].join('\n')),
    correoDuplicado: await validarCsv([
      'nombre,puesto,correo,cedula,estado',
      'Profesor Correo Duplicado,Profesores,elena.garro@manantial.edu.mx,DOC-CORREO-DEMO-001,Activo',
    ].join('\n')),
    puestoIncorrecto: await validarCsv([
      'nombre,puesto,correo,cedula,estado',
      'Directivo Importado,Directivos,directivo.importado.demo@manantial.edu.mx,DOC-DIRECTIVO-DEMO-001,Activo',
    ].join('\n')),
    encabezadosFaltantes: await validarCsv([
      'nombre,correo',
      'Fila Incompleta,fila.incompleta.demo@manantial.edu.mx',
    ].join('\n')),
  };
  for (const resultado of Object.values(invalidas)) {
    assert.ok(resultado.totalErrores > 0);
    assert.equal(resultado.totalValidos, 0);
  }

  const calificacionDatos = {
    matricula: 'CM-2026-005',
    materia: 'Matemáticas IV',
    periodo: '1er Trimestre',
    calificacion: 8.6,
  };
  const calificacion = await request('/calificaciones', {
    method: 'POST',
    body: JSON.stringify(calificacionDatos),
  }, 201);
  await request('/calificaciones', {
    method: 'POST',
    body: JSON.stringify(calificacionDatos),
  }, 409);
  const calificacionActualizada = await request(`/calificaciones/${calificacion.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ calificacion: 9.1 }),
  });
  assert.equal(calificacionActualizada.data.calificacion, 9.1);
  await request(`/calificaciones/${calificacion.data.id}`, { method: 'DELETE' });

  const regresion = {};
  for (const modulo of [
    'health',
    'alumnos',
    'asistencias',
    'roles',
    'grados',
    'grupos',
    'materias',
    'profesores',
    'calificaciones',
  ]) {
    const respuesta = await request(`/${modulo}`);
    regresion[modulo] = respuesta.success ?? respuesta.status;
  }
  await request('/importacion/profesores/plantilla');
  await request('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
  await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: '', password: '' }),
  }, 400);
  await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email: '' }),
  }, 400);

  console.log(JSON.stringify({
    altaProfesor: {
      usuarioId: altaProfesor.data.id,
      profesorId: altaProfesor.profesor.id,
      profesorUsuarioId: altaProfesor.profesor.usuarioId,
    },
    relacionesAcademicas: {
      gradoId: gradoCreado.data.id,
      gradoEditado: gradoEditado.data.nombre,
      grupoId: grupoCreado.data.id,
      grupoProfesorIdInicial: grupoCreado.data.profesorId,
      profesorAnteriorSinGrupo: !profesorAnterior.data.grupos.includes(etiquetaGrupo),
      profesorDestinoId,
      profesorDestinoConGrupo: profesorDestino.data.grupos.includes(etiquetaGrupo),
      materiasProfesorDestino: profesorDestino.data.materias,
      estadoGrupoFinal: grupoInactivo.data.estado,
      profesorInactivo: profesorInactivo.error,
      gradoInexistente: gradoInexistente.error,
      grupoDuplicado: grupoDuplicado.error,
      claveDuplicada: claveDuplicada.error,
    },
    altaDirectivo: { usuarioId: altaDirectivo.data.id, profesor: altaDirectivo.profesor },
    altaAdministrativo: {
      usuarioId: altaAdministrativo.data.id,
      profesor: altaAdministrativo.profesor,
    },
    cambioRol: {
      usuarioId: usuarioCambio.data.id,
      profesorId: perfilCambioId,
      estadoFinal: renombrado.profesor.estado,
      nombreFinal: renombrado.profesor.nombre,
    },
    importacion: {
      usuarioId: profesorImportado.usuario.id,
      profesorId: profesorImportado.profesor.id,
      profesorUsuarioId: profesorImportado.profesor.usuarioId,
    },
    xlsxValido: `${validacionXlsx.totalValidos} registro válido`,
    fechaExcel: validacionFecha.validos[0].fechaNacimiento,
    limiteArchivo: archivoExcedido.mensaje,
    importacionesInvalidas: Object.fromEntries(
      Object.entries(invalidas).map(([clave, valor]) => [clave, valor.totalErrores]),
    ),
    calificaciones: 'GET/POST/PUT/DELETE y duplicado 409 aprobados',
    regresion,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
