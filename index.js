const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios'); 
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- MODELOS ---

// Usuario
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['administrador', 'vendedor', 'consultor'], required: true },
    phone: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Venta
const saleSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    items: [{
        productId: Number,
        productName: String,
        quantity: Number,
        unitPrice: Number,
        subtotal: Number
    }],
    saleDate: { type: Date, default: Date.now }
});

const Sale = mongoose.model('Sale', saleSchema);

// --- MIDDLEWARE SEGURIDAD ---
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: "Token requerido" });

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido" });
    }
};

// --- RUTAS ---

// 1. LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, isActive: true });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Credenciales inválidas" });

        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: "Login exitoso",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. CRUD USUARIOS
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const users = await User.find({ isActive: true }, '-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', verifyToken, async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Correo ya registrado" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword, role, phone });
        await newUser.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', verifyToken, async (req, res) => {
    try {
        const { name, email, role, phone, password } = req.body;
        const updateData = { name, email, role, phone };
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
        await User.findByIdAndUpdate(req.params.id, updateData);
        res.json({ message: "Usuario actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. VENTAS (ESTA ES LA RUTA QUE FALTABA O FALLABA)
app.post('/api/sales', verifyToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerName, items, totalAmount } = req.body;
        const sellerId = req.user.id;

        // A. Guardar Venta en MongoDB
        const newSale = new Sale({
            sellerId,
            customerName,
            items,
            totalAmount
        });
        await newSale.save({ session });

        // B. Restar stock en Python (MySQL)
        const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:5000';
        
        for (const item of items) {
            try {
                await axios.put(`${PYTHON_URL}/products/${item.productId}/stock`, {
                    quantity: item.quantity
                });
            } catch (pyError) {
                throw new Error(`Error de stock: ${pyError.message}`);
            }
        }

        await session.commitTransaction();
        res.status(201).json({ message: "Venta registrada", saleId: newSale._id });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error venta:", error);
        res.status(500).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// 4. HISTORIAL DE VENTAS
app.get('/api/sales', verifyToken, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'vendedor') {
            query = { sellerId: req.user.id };
        }
        const sales = await Sale.find(query).populate('sellerId', 'name').sort({ saleDate: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. REPORTES (DASHBOARD)
app.get('/api/reports/dashboard', verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'vendedor') return res.status(403).json({ message: "Acceso denegado" });

        const totals = await Sale.aggregate([
            { $group: { _id: null, totalSales: { $sum: 1 }, totalRevenue: { $sum: "$totalAmount" } } }
        ]);

        const topProducts = await Sale.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.productId", productName: { $first: "$items.productName" }, quantitySold: { $sum: "$items.quantity" }, revenue: { $sum: "$items.subtotal" } } },
            { $sort: { quantitySold: -1 } },
            { $limit: 5 }
        ]);

        const salesBySeller = await Sale.aggregate([
            { $group: { _id: "$sellerId", totalSales: { $sum: 1 }, totalRevenue: { $sum: "$totalAmount" } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "seller" } },
            { $unwind: "$seller" },
            { $project: { sellerName: "$seller.name", totalSales: 1, totalRevenue: 1 } }
        ]);

        res.json({
            summary: totals[0] || { totalSales: 0, totalRevenue: 0 },
            topProducts,
            salesBySeller
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 10. NOTICIAS GAMING (HU16 - Proxy para evitar CORS)
app.get('/api/news', async (req, res) => {
    try {
        const API_KEY = 'ab76e665219049c2b92411a344141fc4';
        const response = await axios.get(`https://newsapi.org/v2/everything`, {
            params: {
                q: 'videojuegos OR gaming OR nintendo OR playstation OR xbox',
                language: 'es', // Noticias en español
                sortBy: 'publishedAt',
                pageSize: 12,
                apiKey: API_KEY
            }
        });
        res.json(response.data.articles);
    } catch (error) {
        console.error("Error NewsAPI:", error.response?.data || error.message);
        res.status(500).json({ message: "Error al obtener noticias" });
    }
});

// Conexión
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Conectado a MongoDB');
        app.listen(process.env.PORT, () => console.log(`Servidor Node corriendo en puerto ${process.env.PORT}`));
    })
    .catch(err => console.error(err));