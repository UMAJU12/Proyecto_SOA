import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createSale } from '../services/api';
import './SalesPage.css';

const SalesPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientName, setClientName] = useState('Cliente Mostrador');
    const navigate = useNavigate();

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        const result = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(result);
    }, [searchTerm, products]);

    const loadProducts = async () => {
        const data = await getProducts();
        setProducts(data.filter(p => p.is_active && p.stock > 0));
        setFilteredProducts(data.filter(p => p.is_active && p.stock > 0));
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            if (existingItem.quantity + 1 > product.stock) {
                alert('¡No hay más stock disponible de este producto!');
                return;
            }
            setCart(cart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                const originalProduct = products.find(p => p.id === id);
                if (newQty > originalProduct.stock) {
                    alert('Stock máximo alcanzado');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!clientName.trim()) {
            alert('Por favor ingrese el nombre del cliente');
            return;
        }

        const saleData = {
            customerName: clientName,
            totalAmount: calculateTotal(),
            items: cart.map(item => ({
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: item.price * item.quantity
            }))
        };

        try {
            await createSale(saleData);
            alert('¡Venta registrada con éxito!');
            setCart([]);
            setClientName('Cliente Mostrador');
            loadProducts();
        } catch (error) {
            alert('Error al registrar venta: ' + error.message);
        }
    };

    // --- FUNCIÓN DE SALIDA INTELIGENTE ---
    const handleExit = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'administrador') {
            navigate('/admin/products'); // Vuelve con permisos de Admin
        } else {
            navigate('/catalog'); // Vuelve como Vendedor normal
        }
    };

    return (
        <div className="sales-page">
            <div className="sales-layout">
                
                {/* COLUMNA IZQUIERDA: CATÁLOGO */}
                <div className="catalog-section">
                    <div className="sales-search">
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Buscar producto..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                         {/* Usamos la nueva función handleExit */}
                         <button className="btn-clear" onClick={handleExit}>
                            Salir
                        </button>
                    </div>

                    <div className="sales-grid">
                        {filteredProducts.map(product => (
                            <div 
                                key={product.id} 
                                className="product-card-mini"
                                onClick={() => addToCart(product)}
                            >
                                <div className="mini-header">
                                    <h4>{product.name}</h4>
                                    <span className="mini-stock">Stock: {product.stock}</span>
                                </div>
                                <div className="mini-price">${product.price}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMNA DERECHA: CARRITO */}
                <div className="cart-panel">
                    <div className="cart-header">
                        <h2>🛒 Nueva Venta</h2>
                    </div>

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <p style={{textAlign:'center', color:'#999', marginTop:'20px'}}>
                                Carrito vacío.<br/>Selecciona productos de la izquierda.
                            </p>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="item-info">
                                        <h5>{item.name}</h5>
                                        <small>${item.price} x {item.quantity}</small>
                                    </div>
                                    <div className="item-controls">
                                        <button className="btn-qty" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button className="btn-qty" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                        <button className="btn-remove" onClick={() => removeFromCart(item.id)}>🗑️</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-footer">
                        <label style={{fontSize:'12px', fontWeight:'600', color:'#555'}}>Cliente</label>
                        <input 
                            type="text" 
                            className="client-input" 
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        />
                        
                        <div className="total-row">
                            <span>Total:</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>

                        <button 
                            className="btn-checkout" 
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                        >
                            ✅ Confirmar Venta
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SalesPage;