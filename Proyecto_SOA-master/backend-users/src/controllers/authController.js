// src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// 🆕 Función para obtener redirección según rol (NUEVO - HU08)
const getRedirectByRole = (role) => {
  const redirects = {
    'administrador': '/admin/dashboard',
    'vendedor': '/vendedor/ventas',
    'consultor': '/consultor/reportes'
  };
  return redirects[role] || '/';
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que vengan email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione correo y contraseña'
      });
    }

    // Buscar usuario por email (incluir password)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user._id);

    // 🆕 CAMBIO: Agregar redirectTo según rol (HU08)
    const redirectTo = getRedirectByRole(user.role);

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: `Bienvenido ${user.name}`, // 🆕 Mensaje personalizado
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      redirectTo // 🆕 NUEVO: Redirección según rol
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al iniciar sesión'
    });
  }
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public (o Admin only - puedes protegerlo después)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validar campos requeridos
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione nombre, correo y contraseña'
      });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'vendedor',
      phone
    });

    // Generar token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error en el servidor al registrar usuario'
    });
  }
};

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil de usuario'
    });
  }
};

// 🆕 NUEVO: Verificar token (opcional pero útil)
exports.verifyToken = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token válido',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone
      }
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar token'
    });
  }
};

// 🆕 NUEVO: Logout (opcional)
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    // Construir filtro
    let filter = {};
    
    // Filtrar por rol si se proporciona
    if (role) {
      filter.role = role;
    }

    // Búsqueda por nombre o email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Buscar usuarios (excluir password)
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

// @desc    Actualizar rol de usuario
// @route   PUT /api/auth/users/:userId/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validar que el rol sea válido
    const rolesValidos = ['administrador', 'vendedor', 'consultor'];
    if (!role || !rolesValidos.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser: administrador, vendedor o consultor'
      });
    }

    // Buscar el usuario
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Prevenir que un admin se quite sus propios privilegios
    if (user._id.toString() === req.user._id.toString() && role !== 'administrador') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol de administrador'
      });
    }

    // Guardar rol anterior para el log
    const rolAnterior = user.role;

    // Actualizar el rol
    user.role = role;
    await user.save();

    console.log(`✅ Rol actualizado: ${user.name} - ${rolAnterior} → ${role}`);

    res.status(200).json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        rolAnterior: rolAnterior,
        rolNuevo: user.role,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el rol del usuario'
    });
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/auth/users/:userId
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
};