
const alumnosService = require('./alumnos.service');
const alumnosModel = require('../models/alumnos.model');
const gradosService = require('./grados.service');
const gruposModel = require('../models/grupos.model');
const gradosModel = require('../models/grados.model');
const materiasModel = require('../models/materias.model');
const rolesService = require('./roles.service');
const rolesModel = require('../models/roles.model');
const profesoresModel = require('../models/profesores.model');

// VALIDACIÓN DE ALUMNOS

const CAMPOS_OBLIGATORIOS = [
  'matricula',
  'nombre',
  'fechaNacimiento',
  'grado',
  'grupo',
  'tutor'
];

// Valida los alumnos del Excel sin guardarlos
function validarAlumnos(registros) {
  const validos = [];
  const errores = [];
  const matriculas = new Set();

  if (!Array.isArray(registros) || registros.length === 0) {
    return {
      totalRegistros: 0,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: ['El archivo está vacío o no contiene registros.']
    };
  }

  // Comprueba que existan las columnas necesarias
  const encabezados = Object.keys(registros[0]);

  const faltantes = CAMPOS_OBLIGATORIOS.filter(
    campo => !encabezados.includes(campo)
  );

  if (faltantes.length > 0) {
    return {
      totalRegistros: registros.length,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: [`Faltan columnas: ${faltantes.join(', ')}`]
    };
  }

  registros.forEach((registro, indice) => {
    const fila = indice + 2;
    const datos = {};

    for (const campo of CAMPOS_OBLIGATORIOS) {
      datos[campo] = String(registro[campo] ?? '').trim();
    }

    if (registro.estado !== undefined) {
      datos.estado = String(registro.estado).trim();
    }

    const erroresFila = [];

    // Reutiliza las validaciones del backend de alumnos
    try {
      alumnosService.validarAlumno(datos);
    } catch (error) {
      erroresFila.push(error.message);
    }

    // Comprueba las matrículas duplicadas
    if (datos.matricula) {
      if (matriculas.has(datos.matricula)) {
        erroresFila.push('Matrícula duplicada dentro del archivo.');
      } else {
        matriculas.add(datos.matricula);
      }

      if (alumnosModel.findByMatricula(datos.matricula)) {
        erroresFila.push('La matrícula ya está registrada en el sistema.');
      }
    }

    if (erroresFila.length > 0) {
      errores.push({
        fila,
        matricula: datos.matricula,
        motivos: erroresFila
      });
    } else {
      validos.push(datos);
    }
  });

  return {
    totalRegistros: registros.length,
    totalValidos: validos.length,
    totalErrores: errores.length,
    validos,
    errores
  };
}

// VALIDACIÓN DE GRADOS

// Valida los grados del Excel sin guardarlos
function validarGrados(registros) {
  const validos = [];
  const errores = [];
  const claves = new Set();

  const campos = ['nivel', 'numeroGrado', 'cicloEscolarId'];

  if (!Array.isArray(registros) || registros.length === 0) {
    return {
      totalRegistros: 0,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: ['El archivo no contiene registros.']
    };
  }

  // Comprueba los encabezados de la plantilla
  const encabezados = Object.keys(registros[0]);

  const faltantes = campos.filter(
    campo => !encabezados.includes(campo)
  );

  if (faltantes.length > 0) {
    return {
      totalRegistros: registros.length,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: [`Faltan columnas: ${faltantes.join(', ')}`]
    };
  }

  // Consulta los grados que ya existen
  const existentes = gradosService.getAllGrados({});

  registros.forEach((registro, indice) => {
    const datos = {};
    const motivos = [];

    for (const campo of campos) {
      datos[campo] = String(registro[campo] ?? '').trim();

      if (!datos[campo]) {
        motivos.push(`El campo ${campo} es obligatorio.`);
      }
    }

    const numeroGrado = Number(datos.numeroGrado);
    const cicloEscolarId = Number(datos.cicloEscolarId);
    if (!Number.isInteger(numeroGrado)) motivos.push('numeroGrado debe ser un entero.');
    if (!Number.isInteger(cicloEscolarId)) motivos.push('cicloEscolarId debe ser un entero.');

    // Genera una clave para identificar registros repetidos
    const clave = campos
      .map(campo => datos[campo].toLowerCase())
      .join('|');

    // Detecta duplicados dentro del Excel
    if (claves.has(clave)) {
      motivos.push('Grado duplicado dentro del archivo.');
    } else {
      claves.add(clave);
    }

    // Detecta grados registrados previamente
    const existe = existentes.some(grado =>
      campos.every(campo =>
        String(grado[campo] ?? '').trim().toLowerCase() ===
        datos[campo].toLowerCase()
      )
    );

    if (existe) {
      motivos.push('El grado ya está registrado en el sistema.');
    }

    if (motivos.length > 0) {
      errores.push({
        fila: indice + 2,
        nombre: `${datos.numeroGrado}° ${datos.nivel}`,
        motivos
      });
    } else {
      validos.push({
        nivel: datos.nivel,
        numeroGrado,
        cicloEscolarId
      });
    }
  });

  return {
    totalRegistros: registros.length,
    totalValidos: validos.length,
    totalErrores: errores.length,
    validos,
    errores
  };
}


function validarGrupos(registros) {
  const validos = [];
  const errores = [];
  const claves = new Set();

  const campos = [
    'gradoId',
    'nombre',
    'grupoLetra',
    'clave',
    'aula',
    'edificio',
    'turno',
    'profesorId',
    'alumnosMax',
    'estado'
  ];

  if (!Array.isArray(registros) || registros.length === 0) {
    return {
      totalRegistros: 0,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: ['El archivo no contiene registros.']
    };
  }

  // Comprueba que existan los encabezados de la plantilla
  const faltantes = campos.filter(
    campo => !Object.keys(registros[0]).includes(campo)
  );

  if (faltantes.length > 0) {
    return {
      totalRegistros: registros.length,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: [`Faltan columnas: ${faltantes.join(', ')}`]
    };
  }

  registros.forEach((registro, indice) => {
    const datos = {};

    for (const campo of campos) {
      datos[campo] = String(registro[campo] ?? '').trim();
    }

    const motivos = [];

    // Campos necesarios para identificar un grupo
    for (const campo of ['gradoId', 'nombre', 'grupoLetra', 'clave']) {
      if (!datos[campo]) {
        motivos.push(`El campo ${campo} es obligatorio.`);
      }
    }

    // Comprueba que el grado exista
    if (datos.gradoId && !gradosModel.findById(datos.gradoId)) {
      motivos.push('El grado no existe en el sistema.');
    }

    if (
      datos.turno &&
      !['matutino', 'vespertino'].includes(datos.turno.toLowerCase())
    ) {
      motivos.push('El turno debe ser matutino o vespertino.');
    }

    if (
      datos.estado &&
      !['Activo', 'Inactivo'].includes(datos.estado)
    ) {
      motivos.push('El estado debe ser Activo o Inactivo.');
    }

    // Valida los campos numéricos antes de convertirlos
    for (const campo of ['profesorId', 'alumnosMax']) {
      if (
        datos[campo] &&
        (!Number.isInteger(Number(datos[campo])) ||
         Number(datos[campo]) <= 0)
      ) {
        motivos.push(
          `El campo ${campo} debe ser un número entero positivo.`
        );
      }
    }

    // Comprueba que la capacidad no supere 30 alumnos
    if (datos.alumnosMax && Number(datos.alumnosMax) > 30) {
      motivos.push('El grupo no puede superar los 30 alumnos.');
    }

    const clave = datos.clave.toLowerCase();

    // Detecta claves repetidas dentro del Excel
    if (clave) {
      if (claves.has(clave)) {
        motivos.push('Clave duplicada dentro del archivo.');
      } else {
        claves.add(clave);
      }

      // Detecta claves registradas en el backend
      const existe = gruposModel.findAll({}).some(
        grupo => grupo.clave.toLowerCase() === clave
      );

      if (existe) {
        motivos.push('La clave del grupo ya está registrada.');
      }
    }

    if (motivos.length > 0) {
      errores.push({
        fila: indice + 2,
        clave: datos.clave,
        motivos
      });
    } else {
      // Convierte los tipos para el modelo existente
      if (datos.profesorId) {
        datos.profesorId = Number(datos.profesorId);
      }

      if (datos.alumnosMax) {
        datos.alumnosMax = Number(datos.alumnosMax);
      }

      validos.push(datos);
    }
  });

  return {
    totalRegistros: registros.length,
    totalValidos: validos.length,
    totalErrores: errores.length,
    validos,
    errores
  };
}

// VALIDACIÓN DE MATERIAS
// ==================================================

function validarMaterias(registros) {
  const validos = [];
  const errores = [];
  const claves = new Set();

  const campos = [
    'codigo',
    'nombre',
    'claveSep',
    'cargaHoraria',
    'gradoId',
    'gruposAsignados',
    'profesorId',
    'estado',
    'isTroncoComun'
  ];

  if (!Array.isArray(registros) || registros.length === 0) {
    return {
      totalRegistros: 0,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: ['El archivo no contiene registros.']
    };
  }

  // Comprueba los encabezados de la plantilla
  const encabezados = Object.keys(registros[0]);

  const faltantes = campos.filter(
    campo => !encabezados.includes(campo)
  );

  if (faltantes.length > 0) {
    return {
      totalRegistros: registros.length,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: [`Faltan columnas: ${faltantes.join(', ')}`]
    };
  }

  const materiasExistentes = materiasModel.findAll({});
  const gruposExistentes = gruposModel.findAll({});

  registros.forEach((registro, indice) => {
    const datos = {};
    const motivos = [];

    for (const campo of campos) {
      datos[campo] = String(registro[campo] ?? '').trim();
    }

    // Campos obligatorios para importar materias
    for (const campo of ['nombre', 'claveSep', 'gradoId']) {
      if (!datos[campo]) {
        motivos.push(`El campo ${campo} es obligatorio.`);
      }
    }

    // Verifica que el grado exista
    if (datos.gradoId && !gradosModel.findById(datos.gradoId)) {
      motivos.push('El grado no existe en el sistema.');
    }

    // Comprueba el estado de la materia
    const estados = ['Activa', 'Inactiva', 'En planeacion'];

    if (datos.estado && !estados.includes(datos.estado)) {
      motivos.push('El estado de la materia no es válido.');
    }

    // Verifica que profesorId sea un entero positivo
    if (
      datos.profesorId &&
      (!Number.isInteger(Number(datos.profesorId)) ||
       Number(datos.profesorId) <= 0)
    ) {
      motivos.push('profesorId debe ser un número entero positivo.');
    }

    // Detecta claves SEP repetidas
    const clave = datos.claveSep.toLowerCase();

    if (clave) {
      if (claves.has(clave)) {
        motivos.push('Clave SEP duplicada dentro del archivo.');
      } else {
        claves.add(clave);
      }

      const existe = materiasExistentes.some(
        materia =>
          String(materia.claveSep).toLowerCase() === clave
      );

      if (existe) {
        motivos.push('La clave SEP ya está registrada.');
      }
    }

    // Convierte los grupos separados por punto y coma
    // Acepta grupos desde Excel o desde la confirmación JSON
    const grupos = Array.isArray(registro.gruposAsignados)
      ? registro.gruposAsignados
          .map(g => String(g).trim())
          .filter(Boolean)
      : String(registro.gruposAsignados ?? '')
          .split(';')
          .map(g => g.trim())
          .filter(Boolean);

    // Verifica que los grupos pertenezcan al grado indicado
    for (const grupo of grupos) {
      const existe = gruposExistentes.some(g =>
        String(g.gradoId) === datos.gradoId &&
        (
          `${g.gradoId}° ${g.grupoLetra}` === grupo ||
          g.nombre === grupo
        )
      );

      if (!existe) {
        motivos.push(
          `El grupo ${grupo} no existe para el grado seleccionado.`
        );
      }
    }

    // Comprueba el valor de isTroncoComun
    const booleano = datos.isTroncoComun.toLowerCase();

    const valoresBooleanos = [
      'true',
      'false',
      '1',
      '0',
      'si',
      'sí',
      'no'
    ];

    if (booleano && !valoresBooleanos.includes(booleano)) {
      motivos.push('isTroncoComun debe indicar verdadero o falso.');
    }

    if (motivos.length > 0) {
      errores.push({
        fila: indice + 2,
        claveSep: datos.claveSep,
        motivos
      });
    } else {
      // Prepara los tipos de datos para el modelo existente

      // Conserva gruposAsignados, aunque no tenga grupos
      datos.gruposAsignados = grupos;

      // Conserva profesorId, aunque esté vacío
      datos.profesorId = datos.profesorId
        ? Number(datos.profesorId)
        : '';

      // Convierte isTroncoComun a booleano cuando tiene valor
      datos.isTroncoComun = booleano
        ? ['true', '1', 'si', 'sí'].includes(booleano)
        : '';

      validos.push(datos);
    }
  });

  return {
    totalRegistros: registros.length,
    totalValidos: validos.length,
    totalErrores: errores.length,
    validos,
    errores
  };
}


// ==================================================
// VALIDACIÓN DE PROFESORES
// ==================================================

function validarProfesores(registros) {
  const validos = [];
  const errores = [];
  const correos = new Set();
  const cedulas = new Set();

  const campos = ['nombre', 'puesto', 'correo', 'cedula', 'estado'];

  // Comprueba que existan registros
  if (!Array.isArray(registros) || registros.length === 0) {
    return {
      totalRegistros: 0,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: ['El archivo no contiene registros.']
    };
  }

  // Verifica los encabezados del archivo
  const faltantes = campos.filter(
    campo => !Object.keys(registros[0]).includes(campo)
  );

  if (faltantes.length > 0) {
    return {
      totalRegistros: registros.length,
      totalValidos: 0,
      totalErrores: 1,
      validos,
      errores: [`Faltan columnas: ${faltantes.join(', ')}`]
    };
  }

  registros.forEach((registro, indice) => {
    const datos = {};
    const motivos = [];

    // Limpia los valores del archivo
    for (const campo of campos) {
      datos[campo] = String(registro[campo] ?? '').trim();
    }

    // Verifica los campos obligatorios
    for (const campo of ['nombre', 'correo', 'cedula']) {
      if (!datos[campo]) {
        motivos.push(`El campo ${campo} es obligatorio.`);
      }
    }

    // Solo permite importar personal con puesto de profesor
    if (datos.puesto !== 'Profesores') {
      motivos.push('El puesto debe ser Profesores.');
    }

    // Comprueba el formato del correo
    if (
      datos.correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)
    ) {
      motivos.push('El correo electrónico no es válido.');
    }

    // Comprueba el estado
    if (
      datos.estado &&
      !['Activo', 'Inactivo'].includes(datos.estado)
    ) {
      motivos.push('El estado debe ser Activo o Inactivo.');
    }

    // Detecta correos duplicados dentro del archivo
    const correo = datos.correo.toLowerCase();

    if (correo) {
      if (correos.has(correo)) {
        motivos.push('Correo duplicado dentro del archivo.');
      } else {
        correos.add(correo);
      }

      // Comprueba si el correo ya está registrado
      const existente = rolesModel.findByCorreo(datos.correo);

      if (existente) {
        motivos.push('El correo ya está registrado en el sistema.');
      }
    }

    const cedula = datos.cedula.toLowerCase();
    if (cedula) {
      if (cedulas.has(cedula)) {
        motivos.push('Cédula duplicada dentro del archivo.');
      } else {
        cedulas.add(cedula);
      }

      if (profesoresModel.findByCedula(datos.cedula)) {
        motivos.push('La cédula ya está registrada en el sistema.');
      }
    }

    if (motivos.length > 0) {
      errores.push({
        fila: indice + 2,
        correo: datos.correo,
        motivos
      });
    } else {
      // Establece el estado predeterminado
      if (!datos.estado) {
        datos.estado = 'Activo';
      }

      validos.push(datos);
    }
  });

  return {
    totalRegistros: registros.length,
    totalValidos: validos.length,
    totalErrores: errores.length,
    validos,
    errores
  };
}

// Exporta las funciones para utilizarlas en las rutas
module.exports = {
  validarAlumnos,
  validarGrados,
  validarGrupos,
  validarMaterias,
  validarProfesores
};
