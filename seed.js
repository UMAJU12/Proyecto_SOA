const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Definición simple del esquema de usuario para la carga
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['administrador', 'vendedor', 'consultor'], default: 'vendedor' },
    phone: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB para seed...');

        // Limpiar usuarios anteriores
        await User.deleteMany({});

        // Encriptar contraseña genérica
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('12345678', salt); 

        // Datos del PDF (Página 29-30)
        const users = [
            {
                name: "Administrador Principal",
                email: "admin@gamingstore.com",
                password: passwordHash,
                role: "administrador",
                phone: "7711234567"
            },
            {
                name: "Juan Pérez García",
                email: "juan.perez@gamingstore.com",
                password: passwordHash,
                role: "vendedor",
                phone: "7719876543"
            },
            {
                name: "María López Hernández",
                email: "maria.lopez@gamingstore.com",
                password: passwordHash,
                role: "vendedor",
                phone: "7715551234"
            },
            {
                name: "Carlos Ramírez Sánchez",
                email: "carlos.ramirez@gamingstore.com",
                password: passwordHash,
                role: "consultor",
                phone: "7717778888"
            }
        ];

        await User.insertMany(users);
        console.log('Usuarios insertados correctamente según el PDF.');
        process.exit();
    } catch (error) {
        console.error('Error al insertar datos:', error);
        process.exit(1);
    }
};

seedDB();