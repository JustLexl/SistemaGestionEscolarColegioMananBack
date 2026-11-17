require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('No se pudo fijar dns servers:', e.message);
}

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

async function testConnection() {
  if (!uri) {
    console.error('❌ MONGODB_URI no está definido en las variables de entorno (.env).');
    process.exit(1);
  }

  console.log('Intentando conectar a MongoDB Atlas...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Conexión exitosa a MongoDB Atlas!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Colecciones existentes:', collections.map(c => c.name));
    await mongoose.disconnect();
    console.log('Desconectado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
}

testConnection();
