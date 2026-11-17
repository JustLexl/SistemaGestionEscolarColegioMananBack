const dns = require('dns');
const mongoose = require('mongoose');

// Solución para resolución DNS de SRV en Node.js sobre Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[Database] Advertencia al configurar servidores DNS:', err.message);
}

let isConnected = false;

async function connectDB(customUri) {
  const uri = customUri || process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[Database] MONGODB_URI no está definido. Omitiendo conexión a base de datos.');
    return null;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    console.log('[Database] Conectando a MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`[Database] MongoDB Atlas conectado con éxito: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error(`[Database] Error conectando a MongoDB: ${error.message}`);
    isConnected = false;
    return null;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] Conexión a MongoDB cerrada.');
  }
}

function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  return {
    state: states[readyState] || 'unknown',
    readyState,
    isConnected: readyState === 1,
    host: readyState === 1 ? mongoose.connection.host : null,
    database: readyState === 1 ? mongoose.connection.name : null,
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
};
