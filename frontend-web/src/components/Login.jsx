import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import './Login.css'; // <--- Importamos tus estilos aquí

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Agregué estado de carga para mejor UX
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const data = await loginUser(email, password);
            
            // Guardar sesión
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirección según rol
            if (data.user.role === 'administrador') {
                navigate('/admin/products');
            } else {
                navigate('/catalog');
            }
        } catch (err) {
            setError(err.message || 'Credenciales incorrectas');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>Gaming Store SOA</h1>
                    <p>Ingresa a tu cuenta para gestionar la tienda</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input 
                            id="email"
                            type="email" 
                            placeholder="ejemplo@gamingstore.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input 
                            id="password"
                            type="password" 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Sistema de Gestión de Videojuegos</p>
                    <small>© 2025 Proyecto Arquitectura Orientada a Servicios</small>
                </div>
            </div>
        </div>
    );
};

export default Login;