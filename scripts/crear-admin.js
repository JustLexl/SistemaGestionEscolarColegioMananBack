require('dotenv').config();
const { connectDB, disconnectDB } = require('../src/config/database');
const { RolMongo } = require('../src/database/schemas');

async function crearAdmin() {
  const nombre = process.argv[2] || 'Administrador Colegio';
  const correo = process.argv[3] || 'admin@manantial.edu.mx';
  const contrasena = process.argv[4] || 'Admin123*';
  const puesto = process.argv[5] || 'Directivos';

  console.log(`--- Creando Usuario Administrador en MongoDB Atlas ---`);
  console.log(`Nombre:     ${nombre}`);
  console.log(`Correo:     ${correo}`);
  console.log(`Contraseña: ${contrasena}`);
  console.log(`Puesto:     ${puesto}`);

  const conn = await connectDB();
  if (!conn) {
    console.error('❌ Error conectando a MongoDB Atlas.');
    process.exit(1);
  }

  const existing = await RolMongo.findOne({ correo: correo.toLowerCase().trim() });
  if (existing) {
    console.log(`El usuario con correo ${correo} ya existe. Actualizando contraseña y estado...`);
    existing.nombre = nombre;
    existing.puesto = puesto;
    existing.contrasena = contrasena;
    existing.estado = 'Activo';
    await existing.save();
    console.log('✅ Usuario actualizado exitosamente.');
  } else {
    const count = await RolMongo.countDocuments();
    const newAdmin = new RolMongo({
      id: count + 1,
      nombre,
      puesto,
      correo: correo.toLowerCase().trim(),
      contrasena,
      estado: 'Activo'
    });
    await newAdmin.save();
    console.log(`✅ Usuario creado exitosamente con ID: ${newAdmin.id}`);
  }

  await disconnectDB();
  process.exit(0);
}

crearAdmin().catch(err => {
  console.error('Error al crear administrador:', err);
  process.exit(1);
});
