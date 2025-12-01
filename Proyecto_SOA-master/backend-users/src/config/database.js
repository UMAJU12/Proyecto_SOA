// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB conectado correctamente');
    console.log(`📦 Base de datos: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    
  } catch (error) {
    console.error('❌ Error al conectar MongoDB:', error.message);
    process.exit(1);
  }
};

// 🆕 Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose desconectado de MongoDB');
});

// Cerrar conexión cuando la app se cierra
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 Conexión MongoDB cerrada por terminación de app');
  process.exit(0);
});

module.exports = connectDB;