import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import UserList from './components/UserList'; 
import UserForm from './components/UserForm';
import SalesPage from './components/SalesPage';
import SalesHistory from './components/SalesHistory';
import ReportsPage from './components/ReportsPage';
import NewsPage from './components/NewsPage'; // <--- IMPORTAR NOTICIAS

function App() {
  return (
    <Router>
      <div className="bg-light min-vh-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Públicas / Vendedor */}
          <Route path="/catalog" element={<ProductList />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/history" element={<SalesHistory />} />
          <Route path="/news" element={<NewsPage />} /> {/* <--- RUTA DE NOTICIAS AGREGADA */}
          
          {/* GESTIÓN DE PRODUCTOS */}
          <Route path="/admin/products" element={<ProductList isAdmin={true} />} />
          <Route path="/admin/products/new" element={<ProductForm />} />
          <Route path="/admin/products/edit/:id" element={<ProductForm />} />
          <Route path="/admin/reports" element={<ReportsPage />} />

          {/* GESTIÓN DE USUARIOS */}
          <Route path="/admin/users" element={<UserList />} />
          <Route path="/admin/users/new" element={<UserForm />} />
          <Route path="/admin/users/edit/:id" element={<UserForm />} />
          
          <Route path="*" element={<Navigate to="/login" />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;