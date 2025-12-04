import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import { generatePDF, generateExcel } from '../utils/reportGenerator';
import './ReportsPage.css';

const ReportsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Error cargando reportes");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="reports-page">Cargando estadísticas...</div>;
    if (!stats) return <div className="reports-page">Error al cargar datos.</div>;

    return (
        <div className="reports-page">
            <div className="reports-header">
                <h2>📊 Dashboard Ejecutivo</h2>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="btn-back" 
                        style={{ backgroundColor: '#e91e63' }} 
                        onClick={() => generatePDF(stats)}
                    >
                        📄 Descargar PDF
                    </button>
                    
                    <button 
                        className="btn-back" 
                        style={{ backgroundColor: '#2e7d32' }} 
                        onClick={() => generateExcel(stats)}
                    >
                        📊 Descargar Excel
                    </button>

                    <button className="btn-back" onClick={() => navigate('/admin/products')}>
                        Volver al Inicio
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card revenue">
                    <span className="stat-title">Ingresos Totales</span>
                    <span className="stat-value">${stats.summary.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="stat-card sales">
                    <span className="stat-title">Ventas Realizadas</span>
                    <span className="stat-value">{stats.summary.totalSales}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-title">Producto Top</span>
                    <span className="stat-value" style={{fontSize:'20px'}}>
                        {stats.topProducts[0]?.productName || 'N/A'}
                    </span>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>🏆 Productos Más Vendidos</h3>
                    </div>
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Vendidos</th>
                                <th>Ingresos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topProducts.map((p, idx) => (
                                <tr key={idx}>
                                    <td>{p.productName}</td>
                                    <td>
                                        {p.quantitySold}
                                        <div className="bar-container">
                                            <div 
                                                className="bar-fill" 
                                                style={{width: `${(p.quantitySold / (stats.topProducts[0]?.quantitySold || 1)) * 100}%`}}
                                            ></div>
                                        </div>
                                    </td>
                                    <td>${p.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="chart-container">
                    <div className="chart-header">
                        <h3>👤 Rendimiento de Vendedores</h3>
                    </div>
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Vendedor</th>
                                <th>Ventas</th>
                                <th>Total Generado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.salesBySeller.map((s, idx) => (
                                <tr key={idx}>
                                    <td>{s.sellerName}</td>
                                    <td>{s.totalSales}</td>
                                    <td>${s.totalRevenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;