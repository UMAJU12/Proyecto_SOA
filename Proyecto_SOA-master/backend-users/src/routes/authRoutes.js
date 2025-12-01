// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  login, 
  register, 
  getMe, 
  verifyToken,
  logout,
  getAllUsers,      // 🆕 HU07
  updateUserRole,   // 🆕 HU07
  getUserById       // 🆕 HU07
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth'); // 🆕 Agregar authorize

// ============================================
// RUTAS PÚBLICAS
// ============================================

// HU08 - Login para todos los roles
router.post('/login', login);

// Registro de usuarios
router.post('/register', register);

// ============================================
// RUTAS PROTEGIDAS - TODOS LOS USUARIOS
// ============================================

// Obtener perfil del usuario actual
router.get('/me', protect, getMe);

// Verificar si el token es válido
router.get('/verify', protect, verifyToken);

// Logout
router.post('/logout', protect, logout);

// ============================================
// 🆕 HU07 - RUTAS PROTEGIDAS - SOLO ADMINISTRADOR
// ============================================

// Obtener todos los usuarios (con filtros opcionales)
router.get('/users', protect, authorize('administrador'), getAllUsers);

// Obtener usuario específico por ID
router.get('/users/:userId', protect, authorize('administrador'), getUserById);

// Actualizar rol de usuario
router.put('/users/:userId/role', protect, authorize('administrador'), updateUserRole);

module.exports = router;