// src/models/Sale.js
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: Number,
    required: [true, 'El ID del producto es requerido']
  },
  productName: {
    type: String,
    required: [true, 'El nombre del producto es requerido']
  },
  quantity: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: [1, 'La cantidad debe ser al menos 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'El precio unitario es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  subtotal: {
    type: Number,
    required: [true, 'El subtotal es requerido'],
    min: [0, 'El subtotal no puede ser negativo']
  }
});

const saleSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El vendedor es requerido']
  },
  customerName: {
    type: String,
    required: [true, 'El nombre del cliente es requerido'],
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  customerPhone: {
    type: String,
    trim: true
  },
  items: {
    type: [saleItemSchema],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Debe haber al menos un producto en la venta'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, 'El monto total es requerido'],
    min: [0, 'El total no puede ser negativo']
  },
  paymentMethod: {
    type: String,
    enum: ['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'],
    default: 'efectivo'
  },
  status: {
    type: String,
    enum: ['completada', 'cancelada', 'pendiente'],
    default: 'completada'
  },
  saleDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
saleSchema.index({ sellerId: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ 'items.productId': 1 });

module.exports = mongoose.model('Sale', saleSchema);