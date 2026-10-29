/**
 * Semilla de datos iniciales para la tabla / módulo de Profesores.
 * Los nombres, cédulas y asignaciones reutilizan los datos ficticios de
 * materias.seed.js y grupos.seed.js.
 */
const initialProfesores = [
  {
    id: 1,
    nombre: 'Profra. Carmen Salinas',
    cedula: 'DOC-2018-042',
    materias: [
      'Matemáticas IV',
      'Ciencias Naturales y Tecnología',
      'Robótica y Pensamiento Computacional'
    ],
    grupos: ['4° A', '4° B', '5° A', '6° A'],
    estado: 'Activo'
  },
  {
    id: 2,
    nombre: 'Profra. Elena Garro',
    cedula: 'DOC-2019-018',
    materias: ['Lengua Materna (Español IV)', 'Francés Optativo'],
    grupos: ['4° A', '4° B', '6° B'],
    estado: 'Activo'
  },
  {
    id: 3,
    nombre: 'Prof. Roberto Carlos Valdés',
    cedula: 'DOC-2021-095',
    materias: [
      'Inglés Bilingüe (Cambridge)',
      'Matemáticas III',
      'Lengua Materna (Español III)'
    ],
    grupos: ['3° A', '3° B', '4° A', '4° B'],
    estado: 'Activo'
  },
  {
    id: 4,
    nombre: 'Profra. Gabriela Mistral',
    cedula: 'DOC-2016-011',
    materias: ['Historia y Geografía', 'Matemáticas V'],
    grupos: ['5° A', '5° B'],
    estado: 'Activo'
  },
  {
    id: 5,
    nombre: 'Prof. Alfonso Reyes Ochoa',
    cedula: 'DOC-2022-073',
    materias: [
      'Formación Cívica y Ética IV',
      'Matemáticas VI',
      'Lengua Materna (Español VI)',
      'Geografía de México y el Mundo'
    ],
    grupos: ['4° A', '4° B', '6° A', '6° B'],
    estado: 'Activo'
  },
  {
    id: 6,
    nombre: 'Profra. Sofía Ramírez',
    cedula: 'DOC-2020-031',
    materias: ['Artes Visuales y Música'],
    grupos: ['1° A', '1° B', '2° A'],
    estado: 'Inactivo'
  },
  {
    id: 7,
    nombre: 'Prof. Miguel Ángel Torres',
    cedula: 'DOC-2017-088',
    materias: [
      'Educación Física y Deportes',
      'Conocimiento del Medio II',
      'Civismo y Valores Institucionales'
    ],
    grupos: ['1° A', '2° A', '2° B', '2° C', '3° A', '4° A'],
    estado: 'Activo'
  }
];

module.exports = initialProfesores;
