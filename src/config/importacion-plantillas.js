const plantillas = Object.freeze({
  alumnos: [
    'matricula', 'nombre', 'fechaNacimiento', 'grado', 'grupo',
    'cicloEscolarId', 'tutor'
  ],
  profesores: ['nombre', 'puesto', 'correo', 'cedula', 'estado'],
  grados: ['nivel', 'numeroGrado', 'cicloEscolarId'],
  grupos: [
    'gradoId', 'nombre', 'grupoLetra', 'clave', 'aula', 'edificio',
    'turno', 'profesorId', 'alumnosMax', 'estado'
  ],
  materias: [
    'codigo', 'nombre', 'claveSep', 'cargaHoraria', 'cicloEscolarId',
    'grupoIds', 'gradoId', 'gruposAsignados', 'profesorId', 'estado',
    'isTroncoComun'
  ],
  asistencias: ['matricula', 'fecha', 'estado']
});

module.exports = plantillas;
