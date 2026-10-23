/**
 * Semilla de datos iniciales para la tabla / módulo de Roles y Usuarios.
 * Tipos de puesto permitidos: 'Administrativo' | 'Directivos' | 'Profesores'
 * Estados permitidos: 'Activo' | 'Inactivo'
 */
const initialRoles = [
  { id: 1, nombre: 'Prof. Javier Méndez', puesto: 'Directivos', correo: 'javier.mendez@manantial.edu.mx', estado: 'Activo' },
  { id: 2, nombre: 'Profra. Carmen Salinas', puesto: 'Directivos', correo: 'carmen.salinas@manantial.edu.mx', estado: 'Activo' },
  { id: 3, nombre: 'Prof. Roberto Carlos Valdés', puesto: 'Profesores', correo: 'roberto.valdes@manantial.edu.mx', estado: 'Activo' },
  { id: 4, nombre: 'Profra. Elena Garro', puesto: 'Profesores', correo: 'elena.garro@manantial.edu.mx', estado: 'Activo' },
  { id: 5, nombre: 'Profra. Gabriela Mistral', puesto: 'Profesores', correo: 'gabriela.mistral@manantial.edu.mx', estado: 'Activo' },
  { id: 6, nombre: 'Prof. Alfonso Reyes', puesto: 'Profesores', correo: 'alfonso.reyes@manantial.edu.mx', estado: 'Activo' },
  { id: 7, nombre: 'Profra. Sofía Ramírez', puesto: 'Profesores', correo: 'sofia.ramirez@manantial.edu.mx', estado: 'Inactivo' },
  { id: 8, nombre: 'Prof. Miguel Ángel Torres', puesto: 'Profesores', correo: 'miguel.torres@manantial.edu.mx', estado: 'Activo' },
  { id: 9, nombre: 'Lic. Patricia Vega', puesto: 'Administrativo', correo: 'patricia.vega@manantial.edu.mx', estado: 'Activo' },
  { id: 10, nombre: 'Lic. Jorge Hernández', puesto: 'Administrativo', correo: 'jorge.hernandez@manantial.edu.mx', estado: 'Inactivo' },
  { id: 11, nombre: 'Psic. Ana Lucía Morales', puesto: 'Administrativo', correo: 'ana.morales@manantial.edu.mx', estado: 'Activo' },
  { id: 12, nombre: 'Ing. Carlos Fuentes', puesto: 'Administrativo', correo: 'carlos.fuentes@manantial.edu.mx', estado: 'Activo' }
];

module.exports = initialRoles;
