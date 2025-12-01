// src/controllers/salesController.js
const Sale = require('../models/Sale');
const axios = require('axios');

// URL del servicio de productos (Flask/Python)
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:5001';

// @desc    Registrar nueva venta
// @route   POST /api/sales
// @access  Private/Vendedor
exports.createSale = async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, paymentMethod } = req.body;

    // Validar que vengan items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe agregar al menos un producto a la venta'
      });
    }

    // Validar cliente
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del cliente es requerido'
      });
    }

    // 1. Verificar stock disponible para cada producto
    for (const item of items) {
      try {
        const productResponse = await axios.get(
          `${PRODUCTS_SERVICE_URL}/api/products/${item.productId}`
        );

        const product = productResponse.data;

        if (!product || !product.id) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${item.productId} no encontrado`
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
          });
        }

        // Agregar datos del producto al item
        item.productName = product.name;
        item.unitPrice = product.price;
        item.subtotal = product.price * item.quantity;

      } catch (error) {
        console.error('Error al verificar producto:', error.message);
        return res.status(500).json({
          success: false,
          message: `Error al verificar disponibilidad del producto ${item.productId}`
        });
      }
    }

    // 2. Calcular total
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    // 3. Crear la venta en MongoDB
    const sale = await Sale.create({
      sellerId: req.user._id,
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'efectivo',
      status: 'completada',
      saleDate: new Date()
    });

    // 4. Actualizar stock de cada producto
    for (const item of items) {
      try {
        await axios.put(
          `${PRODUCTS_SERVICE_URL}/api/products/${item.productId}/stock`,
          { quantity: item.quantity }
        );
      } catch (error) {
        console.error(`Error al actualizar stock del producto ${item.productId}:`, error.message);
        
        // IMPORTANTE: Si falla la actualización de stock, cancelar la venta
        await Sale.findByIdAndUpdate(sale._id, { status: 'cancelada' });
        
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar inventario. Venta cancelada.'
        });
      }
    }

    console.log(`✅ Venta registrada: ${sale._id} - Total: $${totalAmount}`);

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: sale
    });

  } catch (error) {
    console.error('Error al registrar venta:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al registrar la venta'
    });
  }
};

// @desc    Obtener historial de ventas del vendedor
// @route   GET /api/sales/my-sales
// @access  Private/Vendedor
exports.getMySales = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Construir filtro
    let filter = { sellerId: req.user._id };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter)
      .sort({ saleDate: -1 })
      .limit(100);

    const totalAmount = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      count: sales.length,
      totalAmount: totalAmount[0]?.total || 0,
      data: sales
    });

  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de ventas'
    });
  }
};

// @desc    Obtener todas las ventas (Admin/Consultor)
// @route   GET /api/sales
// @access  Private/Admin/Consultor
exports.getAllSales = async (req, res) => {
  try {
    const { sellerId, startDate, endDate, status } = req.query;

    let filter = {};

    if (sellerId) filter.sellerId = sellerId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter)
      .populate('sellerId', 'name email')
      .sort({ saleDate: -1 });

    const totalAmount = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      count: sales.length,
      totalAmount: totalAmount[0]?.total || 0,
      data: sales
    });

  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas'
    });
  }
};

// @desc    Obtener venta por ID
// @route   GET /api/sales/:id
// @access  Private
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('sellerId', 'name email phone');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Vendedores solo pueden ver sus propias ventas
    if (req.user.role === 'vendedor' && 
        sale.sellerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta venta'
      });
    }

    res.status(200).json({
      success: true,
      data: sale
    });

  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta'
    });
  }
};