// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProductsPage from './pages/ProductsPage';
import './App.css';

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente de rutas
const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Ruta raíz - redirige según autenticación */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role === 'administrador' ? 'admin' : user?.role}/dashboard`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Login */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        } 
      />

      {/* Rutas de Administrador */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['administrador']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Ruta para productos */}
      <Route
        path="/admin/productos"
        element={
          <ProtectedRoute allowedRoles={['administrador']}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />

      {/* Rutas de Vendedor (próximamente) */}
      <Route
        path="/vendedor/ventas"
        element={
          <ProtectedRoute allowedRoles={['vendedor']}>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h1>💰 Registro de Ventas</h1>
              <p>Panel de vendedor próximamente...</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Consultor (próximamente) */}
      <Route
        path="/consultor/reportes"
        element={
          <ProtectedRoute allowedRoles={['consultor']}>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h1>📊 Reportes y Análisis</h1>
              <p>Panel de reportes próximamente...</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;