require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Usuarios de prueba
const users = [
  {
    name: "Administrador Principal",
    email: "admin@gamingstore.com",
    password: "Admin123!",
    role: "administrador",
    phone: "7711234567"
  },
  {
    name: "Juan Pérez García",
    email: "juan.perez@gamingstore.com",
    password: "Vendedor123!",
    role: "vendedor",
    phone: "7719876543"
  },
  {
    name: "María López Hernández",
    email: "maria.lopez@gamingstore.com",
    password: "Vendedor123!",
    role: "vendedor",
    phone: "7715551234"
  },
  {
    name: "Carlos Ramírez Sánchez",
    email: "carlos.ramirez@gamingstore.com",
    password: "Consultor123!",
    role: "consultor",
    phone: "7717778888"
  }
];

const seedUsersSafe = async () => {
  try {
    await connectDB();

    console.log('📝 Verificando usuarios...\n');

    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      
      if (exists) {
        console.log(`⚠️  Ya existe: ${userData.email}`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      await User.create({
        ...userData,
        password: hashedPassword
      });
      
      console.log(`✅ Creado: ${userData.email} (${userData.role})`);
    }

    console.log('\n✅ Proceso completado');
    console.log('\n📋 CREDENCIALES DE PRUEBA:');
    console.log('='.repeat(50));
    
    users.forEach(user => {
      console.log(`
👤 ${user.role.toUpperCase()}
   Email: ${user.email}
   Password: ${user.password}
      `);
    });
    
    console.log('='.repeat(50));
    
    const total = await User.countDocuments();
    console.log(`\n📊 Total de usuarios en BD: ${total}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedUsersSafe();