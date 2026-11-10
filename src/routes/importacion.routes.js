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
const usuariosProfesoresService = require('../services/usuarios-profesores.service');

const router = express.Router();

// CONFIGURACIÓN DE ARCHIVOS
// ==================================================

// Permite recibir archivos de hasta 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


// VALIDACIÓN DE ALUMNOS
// ==================================================

router.post(
  '/alumnos/validar',
  upload.single('archivo'),
  procesarValidacion(validarAlumnos, 'alumnos')
);

// VALIDACIÓN DE GRADOS
// ==================================================

router.post(
  '/grados/validar',
  upload.single('archivo'),
  procesarValidacion(validarGrados, 'grados')
);

// VALIDACIÓN DE GRUPOS
// ==================================================

router.post(
  '/grupos/validar',
  upload.single('archivo'),
  procesarValidacion(validarGrupos, 'grupos')
);

// VALIDACIÓN DE MATERIAS
// ==================================================

router.post(
  '/materias/validar',
  upload.single('archivo'),
  procesarValidacion(validarMaterias, 'materias')
);

// VALIDACIÓN DE PROFESORES
// ==================================================

router.post(
  '/profesores/validar',
  upload.single('archivo'),
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
    'cedula',
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
    profesor => usuariosProfesoresService.crearUsuarioConPerfilSiCorresponde(profesor),
    'profesores'
  )
);

// Exporta las rutas para utilizarlas desde index.js
module.exports = router;
