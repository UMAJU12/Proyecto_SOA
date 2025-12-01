// src/pages/AdminDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <h2>🎮 Gaming Store</h2>
        </div>
        <div className="navbar-user">
          <span>👤 {user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>¡Bienvenido, {user?.name}!</h1>
          <p>Panel de Administrador - Sistema de Gestión Gaming Store</p>
        </div>

        <div className="cards-grid">
          <div className="dashboard-card">
            <div className="card-icon">📦</div>
            <h3>Productos</h3>
            <p>Gestionar catálogo de productos gaming</p>
            <button onClick={() => navigate('/admin/productos')} className="card-button">
              Ver Productos
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Usuarios</h3>
            <p>Administrar usuarios del sistema</p>
            <button className="card-button" disabled>
              Próximamente
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💰</div>
            <h3>Ventas</h3>
            <p>Ver y gestionar ventas realizadas</p>
            <button className="card-button" disabled>
              Próximamente
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Reportes</h3>
            <p>Análisis y estadísticas del sistema</p>
            <button className="card-button" disabled>
              Próximamente
            </button>
          </div>
        </div>

        <div className="info-section">
          <h2>🎯 Sprint 1 - Historias Completadas</h2>
          <ul>
            <li>✅ HU01 - Login de Administrador (3 puntos)</li>
            <li>✅ HU02 - Registrar Productos Gaming (5 puntos)</li>
            <li>⏳ HU03 - Consultar Catálogo de Productos (4 puntos)</li>
            <li>⏳ HU04 - Editar Productos (4 puntos)</li>
            <li>⏳ HU05 - Eliminar Productos (3 puntos)</li>
          </ul>
          <p><strong>Progreso:</strong> 8/21 puntos completados (38%)</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;