import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSales } from '../services/api';
import './SalesHistory.css';

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            const data = await getSales();
            setSales(data);
        } catch (error) {
            console.error("Error cargando historial");
        } finally {
            setLoading(false);
        }
    };

    // FUNCIÓN CORREGIDA PARA VOLVER
    const handleBack = () => {
        // Leemos el usuario guardado para saber su rol
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (user.role === 'administrador') {
            navigate('/admin/products'); // Ruta con botones de Admin
        } else {
            navigate('/catalog'); // Ruta estándar de Vendedor
        }
    };

    return (
        <div className="history-page">
            <div className="history-container">
                <div className="history-header">
                    <h2>📜 Historial de Ventas</h2>
                    {/* Usamos la nueva función handleBack */}
                    <button className="btn-back" onClick={handleBack}>
                        Volver al Catálogo
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="sales-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Vendedor</th>
                                <th>Productos</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{textAlign:'center'}}>Cargando...</td></tr>
                            ) : sales.length === 0 ? (
                                <tr><td colSpan="5" style={{textAlign:'center'}}>No hay ventas registradas</td></tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale._id}>
                                        <td>{new Date(sale.saleDate).toLocaleString()}</td>
                                        <td>{sale.customerName}</td>
                                        <td>{sale.sellerId?.name || 'Desconocido'}</td>
                                        <td>
                                            <ul className="items-list">
                                                {sale.items.map((item, idx) => (
                                                    <li key={idx}>
                                                        {item.quantity}x {item.productName}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="total-amount">${sale.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesHistory;