import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser } from '../services/api';
import './UserList.css';
import './ProductsPage.css'; // Importamos para reutilizar botones (btn-new, etc)

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error cargando usuarios");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de desactivar este usuario?')) {
            await deleteUser(id);
            loadUsers(); // Recargamos la lista
        }
    };

    // Función auxiliar para clase de color según rol
    const getRoleClass = (role) => {
        if (role === 'administrador') return 'role-admin';
        if (role === 'vendedor') return 'role-vendedor';
        return 'role-consultor';
    };

    return (
        <div className="users-page">
            <div className="search-section">
                <div>
                    <h2 style={{margin:0}}>Gestión de Usuarios</h2>
                    <small style={{color:'#666'}}>Administra el acceso al sistema</small>
                </div>
                
                <div style={{display:'flex', gap:'10px'}}>
                    <button className="btn-nav" onClick={() => navigate('/admin/products')}>
                        📦 Ir a Productos
                    </button>
                    <button className="btn-new" onClick={() => navigate('/admin/users/new')}>
                        + Nuevo Usuario
                    </button>
                </div>
            </div>

            <div className="products-grid">
                {users.map((user) => (
                    <div key={user._id} className="user-card">
                        <div className="card-header-row">
                            <h3>{user.name}</h3>
                            <span className={`role-badge ${getRoleClass(user.role)}`}>
                                {user.role}
                            </span>
                        </div>
                        
                        <div className="user-info">
                            <p>📧 {user.email}</p>
                            <p>📱 {user.phone || 'Sin teléfono'}</p>
                            <p>📅 Registrado: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="card-actions">
                            <button className="btn-edit" onClick={() => navigate(`/admin/users/edit/${user._id}`)}>
                                ✏️ Editar
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(user._id)}>
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserList;