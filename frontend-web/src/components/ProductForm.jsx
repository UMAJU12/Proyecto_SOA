import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, getProductById, updateProduct, getCategories, searchGameExternal } from '../services/api';
import './ProductForm.css';

const ProductForm = () => {
    const [product, setProduct] = useState({
        name: '', description: '', price: '', stock: '', 
        category_id: 1, product_type: 'videojuego_fisico', rating: ''
    });
    const [categories, setCategories] = useState([]);
    const [loadingApi, setLoadingApi] = useState(false); // Estado para el spinner de carga
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const loadInit = async () => {
            const cats = await getCategories();
            setCategories(cats);
            if (id) {
                const data = await getProductById(id);
                setProduct(data);
            }
        };
        loadInit();
    }, [id]);

    const handleChange = (e) => setProduct({ ...product, [e.target.name]: e.target.value });

    // NUEVA FUNCIÓN: Buscar en API Externa
    const handleAutoFill = async () => {
        if (!product.name) {
            alert('Escribe el nombre del juego primero');
            return;
        }
        setLoadingApi(true);
        try {
            const gameData = await searchGameExternal(product.name);
            if (gameData) {
                setProduct(prev => ({
                    ...prev,
                    name: gameData.name,
                    description: gameData.description,
                    rating: gameData.rating,
                    // Mantenemos precio y stock manuales porque eso depende de tu tienda
                }));
                alert('¡Datos encontrados y cargados!');
            } else {
                alert('No se encontró información para este juego.');
            }
        } catch (err) {
            alert('Error al consultar API externa');
        } finally {
            setLoadingApi(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (id) await updateProduct(id, product);
        else await createProduct(product);
        navigate('/admin/products');
    };

    return (
        <div className="form-page">
            <div className="form-container">
                <div className="form-header">
                    <div className="form-title">
                        <span className="icon-plus">{id ? '✏️' : '+'}</span>
                        {id ? 'Editar Producto' : 'Crear Producto'}
                    </div>
                    <button className="btn-close-x" onClick={() => navigate('/admin/products')}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-body">
                        
                        {/* SECCIÓN DE NOMBRE CON AUTO-COMPLETADO */}
                        <div className="input-group">
                            <label>Nombre del Producto *</label>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <input 
                                    name="name" 
                                    className="input-field" 
                                    style={{flex: 1}}
                                    value={product.name} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="Ej. Cyberpunk 2077"
                                />
                                <button 
                                    type="button" 
                                    className="btn-cancel" 
                                    style={{background: '#673ab7', color: 'white', minWidth: '140px'}}
                                    onClick={handleAutoFill}
                                    disabled={loadingApi}
                                >
                                    {loadingApi ? 'Buscando...' : '🔮 Auto-llenar'}
                                </button>
                            </div>
                            <small style={{color: '#888', fontSize: '11px'}}>
                                Escribe el nombre y presiona Auto-llenar para traer datos de internet.
                            </small>
                        </div>

                        <div className="input-row" style={{marginTop: '20px'}}>
                            <div className="input-group">
                                <label>Tipo de Producto *</label>
                                <select name="product_type" className="input-field" value={product.product_type} onChange={handleChange}>
                                    <option value="videojuego_fisico">Videojuego Físico</option>
                                    <option value="videojuego_digital">Videojuego Digital</option>
                                    <option value="consola">Consola</option>
                                    <option value="accesorio">Accesorio</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Categoría *</label>
                                <select name="category_id" className="input-field" value={product.category_id} onChange={handleChange}>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Descripción</label>
                            <textarea name="description" className="input-field" value={product.description} onChange={handleChange}></textarea>
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Precio *</label>
                                <input type="number" name="price" className="input-field" value={product.price} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label>Stock *</label>
                                <input type="number" name="stock" className="input-field" value={product.stock} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="input-row">
                             <div className="input-group">
                                <label>Rating (0-10)</label>
                                <input type="number" step="0.1" name="rating" className="input-field" value={product.rating || ''} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/admin/products')}>Cancelar</button>
                        <button type="submit" className="btn-save">💾 {id ? 'Guardar' : 'Crear'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;