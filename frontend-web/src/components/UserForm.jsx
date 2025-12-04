import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createUser, getUserById, updateUser } from '../services/api';
import './UserForm.css'; // Asegúrate de haber copiado los estilos de ProductForm.css aquí

const UserForm = () => {
    const [user, setUser] = useState({
        name: '', email: '', password: '', role: 'vendedor', phone: ''
    });
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            loadUser();
        }
    }, [id]);

    const loadUser = async () => {
        try {
            const data = await getUserById(id);
            // No cargamos el password por seguridad
            setUser({ ...data, password: '' });
        } catch (error) {
            alert('Error al cargar usuario');
        }
    };

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) {
                await updateUser(id, user);
            } else {
                await createUser(user);
            }
            navigate('/admin/users');
        } catch (error) {
            alert('Error al guardar: ' + (error.message || 'Verifica los datos'));
        }
    };

    return (
        <div className="form-page">
            <div className="form-container">
                <div className="form-header">
                    <div className="form-title">
                        <span className="icon-plus">{id ? '✏️' : '👤'}</span>
                        {id ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </div>
                    <button className="btn-close-x" onClick={() => navigate('/admin/users')}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-body">
                        <div className="input-group">
                            <label>Nombre Completo *</label>
                            <input name="name" className="input-field" value={user.name} onChange={handleChange} required />
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Correo Electrónico *</label>
                                <input type="email" name="email" className="input-field" value={user.email} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label>Teléfono</label>
                                <input type="text" name="phone" className="input-field" value={user.phone || ''} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Rol de Usuario *</label>
                                <select name="role" className="input-field" value={user.role} onChange={handleChange}>
                                    <option value="administrador">Administrador</option>
                                    <option value="vendedor">Vendedor</option>
                                    <option value="consultor">Consultor</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>{id ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'}</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    className="input-field" 
                                    value={user.password} 
                                    onChange={handleChange}
                                    placeholder={id ? "Dejar en blanco para mantener actual" : "Mínimo 8 caracteres"}
                                    required={!id} // Solo requerida si es nuevo
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/admin/users')}>Cancelar</button>
                        <button type="submit" className="btn-save">💾 {id ? 'Guardar Cambios' : 'Crear Usuario'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;