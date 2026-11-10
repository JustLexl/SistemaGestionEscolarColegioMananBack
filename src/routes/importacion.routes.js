const express = require('express');
const multer = require('multer');

// Importa las funciones generales del controlador
const {
  procesarValidacion,
  procesarConfirmacion,
  descargarPlantilla
} = require('../controllers/importacion.controller');

const {
  validarAlumnos,
  validarGrados,
  validarGrupos,
  validarMaterias,
  validarProfesores
} = require('../services/importacion.service');

const alumnosService = require('../services/alumnos.service');
const gradosService = require('../services/grados.service');
const gruposService = require('../services/grupos.service');
const materiasService = require('../services/materias.service');
const rolesService = require('../services/roles.service');

const router = express.Router();

// CONFIGURACIÓN DE ARCHIVOS
// ==================================================

// Permite recibir archivos de hasta 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Maneja los errores durante la carga de archivos
function validarArchivo(req, res, next) {
  upload.single('archivo')(req, res, error => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          mensaje: 'El archivo supera el tamaño máximo permitido de 10 MB.'
        });
      }

      return res.status(400).json({
        success: false,
        mensaje: `Error al cargar el archivo: ${error.message}`
      });
    }

    if (error) {
      return next(error);
    }

    next();
  });
}

// VALIDACIÓN DE ALUMNOS
// ==================================================

router.post(
  '/alumnos/validar',
  validarArchivo,
  procesarValidacion(validarAlumnos, 'alumnos')
);

// VALIDACIÓN DE GRADOS
// ==================================================

router.post(
  '/grados/validar',
  validarArchivo,
  procesarValidacion(validarGrados, 'grados')
);

// VALIDACIÓN DE GRUPOS
// ==================================================

router.post(
  '/grupos/validar',
  validarArchivo,
  procesarValidacion(validarGrupos, 'grupos')
);

// VALIDACIÓN DE MATERIAS
// ==================================================

router.post(
  '/materias/validar',
  validarArchivo,
  procesarValidacion(validarMaterias, 'materias')
);

// VALIDACIÓN DE PROFESORES
// ==================================================

router.post(
  '/profesores/validar',
  validarArchivo,
  procesarValidacion(validarProfesores, 'profesores')
);


// PLANTILLAS OFICIALES
// ==================================================

// Define los encabezados de cada plantilla CSV
const plantillas = {

  alumnos: [
    'matricula',
    'nombre',
    'fechaNacimiento',
    'grado',
    'grupo',
    'tutor'
  ],

  profesores: [
    'nombre',
    'puesto',
    'correo',
    'estado'
  ],

  grados: [
    'nombre',
    'nivel',
    'ciclo'
  ],

  grupos: [
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
  ],

  materias: [
    'codigo',
    'nombre',
    'claveSep',
    'cargaHoraria',
    'gradoId',
    'gruposAsignados',
    'profesorId',
    'estado',
    'isTroncoComun'
  ]
};

// DESCARGAR PLANTILLAS
// ==================================================

router.get('/:entidad/plantilla', descargarPlantilla);

// CONFIRMACIÓN DE IMPORTACIONES
// ==================================================

router.post(
  '/alumnos/confirmar',
  procesarConfirmacion(
    validarAlumnos,
    alumno => alumnosService.createAlumno(alumno),
    'alumnos'
  )
);

router.post(
  '/grados/confirmar',
  procesarConfirmacion(
    validarGrados,
    grado => gradosService.createGrado(grado),
    'grados'
  )
);

router.post(
  '/grupos/confirmar',
  procesarConfirmacion(
    validarGrupos,
    grupo => gruposService.createGrupo(grupo),
    'grupos'
  )
);

router.post(
  '/materias/confirmar',
  procesarConfirmacion(
    validarMaterias,
    materia => materiasService.createMateria(materia),
    'materias'
  )
);

// Confirma y guarda únicamente los profesores válidos
router.post(
  '/profesores/confirmar',
  procesarConfirmacion(
    validarProfesores,
    profesor => rolesService.createRol(profesor),
    'profesores'
  )
);

// Exporta las rutas para utilizarlas desde index.js
module.exports = router;
