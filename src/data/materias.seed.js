/**
 * Materias históricas de Demo 2.4.
 *
 * Sólo se persisten atributos propios y relaciones por identificador. Los
 * nombres de Profesor, Grado, Grupo y Ciclo se derivan al serializar.
 * Todos los grupos relacionados existen en grupos.seed.js y pertenecen al
 * ciclo histórico 2024–2025.
 */
module.exports = [
  { id: 1, codigo: 'MAT', nombre: 'Matemáticas IV', claveSep: 'MAT-PRI-04', cargaHoraria: '6 hrs/sem', grupoIds: [1, 2], profesorId: 1, estado: 'Activa', isTroncoComun: true },
  { id: 2, codigo: 'ESP', nombre: 'Lengua Materna (Español IV)', claveSep: 'ESP-PRI-04', cargaHoraria: '6 hrs/sem', grupoIds: [1, 2], profesorId: 2, estado: 'Activa', isTroncoComun: false },
  { id: 3, codigo: 'CIE', nombre: 'Ciencias Naturales y Tecnología', claveSep: 'CIE-PRI-04', cargaHoraria: '4 hrs/sem', grupoIds: [1], profesorId: 1, estado: 'Activa', isTroncoComun: false },
  { id: 4, codigo: 'ING', nombre: 'Inglés Bilingüe (Cambridge)', claveSep: 'ING-CAM-03', cargaHoraria: '5 hrs/sem', grupoIds: [3, 1, 2], profesorId: 3, estado: 'Activa', isTroncoComun: false },
  // 5° B no existe: se conserva únicamente la relación inequívoca con 5° A.
  { id: 5, codigo: 'HIS', nombre: 'Historia y Geografía', claveSep: 'HIS-PRI-05', cargaHoraria: '3 hrs/sem', grupoIds: [4], profesorId: 4, estado: 'Activa', isTroncoComun: false },
  { id: 6, codigo: 'FCE', nombre: 'Formación Cívica y Ética IV', claveSep: 'FCE-PRI-04', cargaHoraria: '2 hrs/sem', grupoIds: [1, 2], profesorId: 5, estado: 'Activa', isTroncoComun: false },
  { id: 7, codigo: 'EDF', nombre: 'Educación Física y Deportes', claveSep: 'EDF-PRI-01', cargaHoraria: '2 hrs/sem', grupoIds: [6, 7, 3, 1], profesorId: 7, estado: 'Activa', isTroncoComun: false },
  { id: 8, codigo: 'ART', nombre: 'Artes Visuales y Música', claveSep: 'ART-PRI-02', cargaHoraria: '2 hrs/sem', grupoIds: [6, 7], profesorId: 6, estado: 'Activa', isTroncoComun: false },
  // 3° B no existe: se conserva 3° A.
  { id: 9, codigo: 'MAT', nombre: 'Matemáticas III', claveSep: 'MAT-PRI-03', cargaHoraria: '6 hrs/sem', grupoIds: [3], profesorId: 3, estado: 'Activa', isTroncoComun: false },
  { id: 10, codigo: 'ESP', nombre: 'Lengua Materna (Español III)', claveSep: 'ESP-PRI-03', cargaHoraria: '6 hrs/sem', grupoIds: [3], profesorId: 3, estado: 'Activa', isTroncoComun: false },
  // 5° B no existe: se conserva 5° A.
  { id: 11, codigo: 'MAT', nombre: 'Matemáticas V', claveSep: 'MAT-PRI-05', cargaHoraria: '6 hrs/sem', grupoIds: [4], profesorId: 4, estado: 'Activa', isTroncoComun: false },
  // 6° B no existe: se conserva 6° A.
  { id: 12, codigo: 'MAT', nombre: 'Matemáticas VI', claveSep: 'MAT-PRI-06', cargaHoraria: '6 hrs/sem', grupoIds: [5], profesorId: 5, estado: 'Activa', isTroncoComun: false },
  { id: 13, codigo: 'ESP', nombre: 'Lengua Materna (Español VI)', claveSep: 'ESP-PRI-06', cargaHoraria: '6 hrs/sem', grupoIds: [5], profesorId: 5, estado: 'Activa', isTroncoComun: false },
  { id: 14, codigo: 'CNM', nombre: 'Conocimiento del Medio II', claveSep: 'CNM-PRI-02', cargaHoraria: '4 hrs/sem', grupoIds: [7, 9], profesorId: 7, estado: 'Activa', isTroncoComun: false },
  { id: 15, codigo: 'ROB', nombre: 'Robótica y Pensamiento Computacional', claveSep: 'ROB-EXT-01', cargaHoraria: '2 hrs/sem', grupoIds: [4, 5], profesorId: 1, estado: 'En planeacion', isTroncoComun: false },
  { id: 16, codigo: 'GEO', nombre: 'Geografía de México y el Mundo', claveSep: 'GEO-PRI-06', cargaHoraria: '3 hrs/sem', grupoIds: [5], profesorId: 5, estado: 'Activa', isTroncoComun: false },
  // El legacy apuntaba a 6° B, inexistente. Se ajusta explícitamente a 6° A.
  { id: 17, codigo: 'FRA', nombre: 'Francés Optativo', claveSep: 'FRA-OPT-01', cargaHoraria: '2 hrs/sem', grupoIds: [5], profesorId: 2, estado: 'En planeacion', isTroncoComun: false },
  // El legacy apuntaba a 2° C, inexistente. Se ajusta explícitamente a 2° B.
  { id: 18, codigo: 'CIV', nombre: 'Civismo y Valores Institucionales', claveSep: 'CIV-PRI-02', cargaHoraria: '2 hrs/sem', grupoIds: [9], profesorId: 7, estado: 'Inactiva', isTroncoComun: false }
];
