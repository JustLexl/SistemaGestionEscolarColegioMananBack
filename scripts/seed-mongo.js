require('dotenv').config();
const { connectDB, disconnectDB, getDBStatus } = require('../src/config/database');
const mongoSync = require('../src/database/mongoSync.service');

async function main() {
  console.log('--- Sembrador de Base de Datos MongoDB Atlas (Colegio Manantial) ---');
  const conn = await connectDB();
  if (!conn) {
    console.error('❌ No se pudo conectar a MongoDB Atlas. Revisa tus credenciales en .env');
    process.exit(1);
  }

  await mongoSync.seedIfEmpty();
  const counts = await mongoSync.getCollectionCounts();

  console.log('\n📊 Conteo de Documentos en MongoDB Atlas:');
  console.table(counts);

  await disconnectDB();
  console.log('✅ Base de datos lista.');
  process.exit(0);
}

main();

