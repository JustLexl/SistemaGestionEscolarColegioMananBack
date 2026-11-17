require('dotenv').config();
const { connectDB, disconnectDB, getDBStatus } = require('../src/config/database');
const {
  RolMongo,
  ProfesorMongo,
  CicloEscolarMongo,
  GradoMongo,
  GrupoMongo,
  MateriaMongo,
  AlumnoMongo,
  AsistenciaMongo,
  CalificacionMongo,
} = require('../src/database/schemas');

const collections = [
  { name: 'roles', model: RolMongo },
  { name: 'profesores', model: ProfesorMongo },
  { name: 'ciclos_escolares', model: CicloEscolarMongo },
  { name: 'grados', model: GradoMongo },
  { name: 'grupos', model: GrupoMongo },
  { name: 'materias', model: MateriaMongo },
  { name: 'alumnos', model: AlumnoMongo },
  { name: 'asistencias', model: AsistenciaMongo },
  { name: 'calificaciones', model: CalificacionMongo },
];

async function cleanDatabase() {
  console.log('--- Limpiando Base de Datos MongoDB Atlas (Colegio Manantial) ---');
  const conn = await connectDB();
  if (!conn) {
    console.error('❌ No se pudo conectar a MongoDB Atlas.');
    process.exit(1);
  }

  console.log('\nEliminando documentos de todas las colecciones...');
  for (const { name, model } of collections) {
    const result = await model.deleteMany({});
    console.log(`- Colección '${name}': eliminados ${result.deletedCount} documentos.`);
  }

  console.log('\nVerificando conteo de colecciones...');
  const counts = {};
  for (const { name, model } of collections) {
    counts[name] = await model.countDocuments();
  }
  console.table(counts);

  await disconnectDB();
  console.log('✅ Base de datos MongoDB Atlas completamente limpia (0 documentos).');
  process.exit(0);
}

cleanDatabase().catch(err => {
  console.error('Error al limpiar la base de datos:', err);
  process.exit(1);
});

