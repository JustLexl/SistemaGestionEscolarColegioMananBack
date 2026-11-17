const mongoose = require('mongoose');

// Definición de esquema genérico con id canónico numérico o string
const createModel = (name, collectionName) => {
  const schema = new mongoose.Schema(
    {
      id: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    },
    {
      strict: false,
      timestamps: true,
      collection: collectionName,
      versionKey: false,
    }
  );

  return mongoose.models[name] || mongoose.model(name, schema);
};

const RolMongo = createModel('Rol', 'roles');
const ProfesorMongo = createModel('Profesor', 'profesores');
const CicloEscolarMongo = createModel('CicloEscolar', 'ciclos_escolares');
const GradoMongo = createModel('Grado', 'grados');
const GrupoMongo = createModel('Grupo', 'grupos');
const MateriaMongo = createModel('Materia', 'materias');
const AlumnoMongo = createModel('Alumno', 'alumnos');
const AsistenciaMongo = createModel('Asistencia', 'asistencias');
const CalificacionMongo = createModel('Calificacion', 'calificaciones');

module.exports = {
  RolMongo,
  ProfesorMongo,
  CicloEscolarMongo,
  GradoMongo,
  GrupoMongo,
  MateriaMongo,
  AlumnoMongo,
  AsistenciaMongo,
  CalificacionMongo,
};

