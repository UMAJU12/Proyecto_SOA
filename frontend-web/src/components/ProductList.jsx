import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/api';
import './ProductsPage.css';

const ProductList = ({ isAdmin }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // LEEMOS EL USUARIO PARA SABER SI ES CONSULTOR
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isConsultor = user.role === 'consultor';

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        let result = products;
        if (searchTerm) {
            result = result.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterCategory) {
            result = result.filter(p => p.product_type === filterCategory);
        }
        setFilteredProducts(result);
    }, [searchTerm, filterCategory, products]);

    const loadData = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
            setFilteredProducts(data);
        } catch (err) {
            console.error("Error loading products");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar producto?')) {
            await deleteProduct(id);
            const newList = products.filter(p => p.id !== id);
            setProducts(newList);
            setFilteredProducts(newList);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterCategory('');
    };

    // --- FUNCIÓN CERRAR SESIÓN ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="products-page">
            
            <div className="top-bar-header">
                <div className="app-title">🎮 Gaming Store 🛍️</div>
                <button className="btn-logout" onClick={handleLogout}>
                    🚪 Cerrar Sesión
                </button>
            </div>
            
            <div className="search-section">
                {/* LADO IZQUIERDO: Buscador */}
                <div className="search-form">
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Buscar por nombre..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select 
                        className="filter-select"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">Todas las categorías</option>
                        <option value="videojuego_fisico">Físico</option>
                        <option value="videojuego_digital">Digital</option>
                        <option value="consola">Consolas</option>
                        <option value="accesorio">Accesorios</option>
                    </select>
                    <button className="btn-search">🔍</button>
                    <button className="btn-clear" onClick={clearFilters}>Limpiar</button>
                </div>

                {/* LADO DERECHO: Acciones */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    
                    <button 
                        className="btn-search" 
                        style={{ backgroundColor: '#00bcd4' }} 
                        onClick={() => navigate('/news')}
                    >
                        📰 Noticias
                    </button>

                    <button 
                        className="btn-search" 
                        style={{ backgroundColor: '#5b73e8' }} 
                        onClick={() => navigate('/sales/history')}
                    >
                        📜 Historial
                    </button>

                    {/* Botón Venta: SE OCULTA SI ES CONSULTOR */}
                    {!isConsultor && (
                        <button 
                            className="btn-search" 
                            style={{ backgroundColor: '#ff9800' }} 
                            onClick={() => navigate('/sales')}
                        >
                            🛒 Ir a Caja
                        </button>
                    )}

                    {/* Botones Admin */}
                    {isAdmin && (
                        <>
                            <button 
                                className="btn-search" 
                                style={{ backgroundColor: '#673ab7' }} 
                                onClick={() => navigate('/admin/reports')}
                            >
                                📊 Reportes
                            </button>

                            <button 
                                className="btn-search" 
                                style={{ backgroundColor: '#333' }} 
                                onClick={() => navigate('/admin/users')}
                            >
                                👥 Usuarios
                            </button>

                            <button className="btn-new" onClick={() => navigate('/admin/products/new')}>
                                + Nuevo
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="products-grid">
                {filteredProducts.map((p) => (
                    <div key={p.id} className="product-card">
                        <div className="card-header-row">
                            <h3>{p.name}</h3>
                            <span className={`stock-pill ${p.stock < 10 ? 'low' : ''}`}>
                                Stock: {p.stock}
                            </span>
                        </div>
                        
                        <div className="product-subtitle">{p.description}</div>
                        
                        <div className="price-row">
                            <div className="price-tag">${p.price}</div>
                            {p.rating && <div className="rating-tag">★ {p.rating}</div>}
                        </div>

                        <div className="tags-row">
                            <span className="tag-badge">{p.category_name || 'General'}</span>
                            <span className="tag-badge">{p.platform_name || 'Multi'}</span>
                        </div>

                        {isAdmin && (
                            <div className="card-actions">
                                <button className="btn-edit" onClick={() => navigate(`/admin/products/edit/${p.id}`)}>
                                    ✏️ Editar
                                </button>
                                <button className="btn-delete" onClick={() => handleDelete(p.id)}>
                                    🗑️ Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductList;