// src/routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const {
  createSale,
  getMySales,
  getAllSales,
  getSaleById
} = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protect);

// Crear venta (solo vendedores y admins)
router.post('/', authorize('vendedor', 'administrador'), createSale);

// Ver mis ventas (vendedores)
router.get('/my-sales', authorize('vendedor'), getMySales);

// Ver todas las ventas (admin y consultores)
router.get('/', authorize('administrador', 'consultor'), getAllSales);

// Ver venta por ID
router.get('/:id', getSaleById);

module.exports = router;