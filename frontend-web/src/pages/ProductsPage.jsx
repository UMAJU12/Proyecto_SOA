// src/pages/ProductsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import './ProductsPage.css';

const ProductsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentProduct, setCurrentProduct] = useState(null);

  // Datos del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    platform_id: '',
    genre_id: '',
    product_type: '',
    rating: ''
  });

  // Cargar productos
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      const data = await productService.getAll(filters);
      setProducts(data.products || []);
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    const filters = {};
    if (searchTerm) filters.name = searchTerm;
    if (selectedCategory) filters.category_id = selectedCategory;
    loadProducts(filters);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    loadProducts();
  };

  // Abrir modal para crear
  const handleCreateClick = () => {
    setModalMode('create');
    setCurrentProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      platform_id: '',
      genre_id: '',
      product_type: '',
      rating: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEditClick = (product) => {
    setModalMode('edit');
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      platform_id: product.platform_id || '',
      genre_id: product.genre_id || '',
      product_type: product.product_type,
      rating: product.rating || ''
    });
    setShowModal(true);
  };

  // Guardar producto (crear o editar)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (modalMode === 'create') {
        await productService.create(formData);
      } else {
        await productService.update(currentProduct.id, formData);
      }
      
      setShowModal(false);
      loadProducts();
      alert(`Producto ${modalMode === 'create' ? 'creado' : 'actualizado'} exitosamente`);
    } catch (err) {
      setError(err.message || 'Error al guardar producto');
    }
  };

  // Eliminar producto
  const handleDeleteClick = async (product) => {
    if (window.confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      try {
        await productService.delete(product.id);
        loadProducts();
        alert('Producto eliminado exitosamente');
      } catch (err) {
        setError('Error al eliminar producto');
      }
    }
  };

  // Cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="products-page">
      {/* Navbar */}
      <nav className="products-navbar">
        <div className="navbar-brand">
          <button onClick={() => navigate('/admin/dashboard')} className="back-button">
            ← Volver
          </button>
          <h2>🎮 Gaming Store - Productos</h2>
        </div>
        <div className="navbar-user">
          <span>👤 {user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="products-content">
        {/* Barra de búsqueda y filtros */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas las categorías</option>
              {productService.getCategories().map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <button type="submit" className="search-button">🔍 Buscar</button>
            <button type="button" onClick={handleClearFilters} className="clear-button">
              🔄 Limpiar
            </button>
          </form>

          <button onClick={handleCreateClick} className="create-button">
            ➕ Nuevo Producto
          </button>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Lista de productos */}
        {loading ? (
          <div className="loading">Cargando productos...</div>
        ) : (
          <div className="products-grid">
            {products.length === 0 ? (
              <div className="no-products">
                No se encontraron productos
              </div>
            ) : (
              products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    <span className={`stock-badge ${product.stock < 10 ? 'low' : ''}`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                  
                  <p className="product-description">{product.description}</p>
                  
                  <div className="product-details">
                    <span className="product-price">${product.price}</span>
                    {product.rating && <span className="product-rating">⭐ {product.rating}</span>}
                  </div>

                  <div className="product-meta">
                    <span className="badge">{product.category_name}</span>
                    {product.platform_name && <span className="badge">{product.platform_name}</span>}
                  </div>

                  <div className="product-actions">
                    <button 
                      onClick={() => handleEditClick(product)}
                      className="edit-button"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(product)}
                      className="delete-button"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? '➕ Crear Producto' : '✏️ Editar Producto'}</h2>
              <button onClick={() => setShowModal(false)} className="close-button">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Producto *</label>
                  <select
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {productService.getProductTypes().map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Rating</label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {productService.getCategories().map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Plataforma</label>
                  <select
                    name="platform_id"
                    value={formData.platform_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Ninguna</option>
                    {productService.getPlatforms().map(plat => (
                      <option key={plat.id} value={plat.id}>{plat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Género</label>
                  <select
                    name="genre_id"
                    value={formData.genre_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Ninguno</option>
                    {productService.getGenres().map(genre => (
                      <option key={genre.id} value={genre.id}>{genre.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-button">
                  Cancelar
                </button>
                <button type="submit" className="save-button">
                  {modalMode === 'create' ? '✅ Crear' : '💾 Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;