import axios from 'axios';

// Configuración de IPs
const USERS_API_URL = 'http://127.0.0.1:4000/api';
const PRODUCTS_API_URL = 'http://127.0.0.1:5000';

// Instancias de Axios
export const usersApi = axios.create({
    baseURL: USERS_API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor para inyectar el token en las peticiones de usuarios
usersApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const productsApi = axios.create({
    baseURL: PRODUCTS_API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// --- AUTENTICACIÓN ---
export const loginUser = async (email, password) => {
    try {
        const response = await usersApi.post('/login', { email, password });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { message: "Error de servidor" };
    }
};

// --- USUARIOS (NUEVO CRUD) ---
export const getUsers = async () => {
    const response = await usersApi.get('/users');
    return response.data;
};

export const getUserById = async (id) => {
    const response = await usersApi.get(`/users/${id}`);
    return response.data;
};

export const createUser = async (userData) => {
    const response = await usersApi.post('/users', userData);
    return response.data;
};

export const updateUser = async (id, userData) => {
    const response = await usersApi.put(`/users/${id}`, userData);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await usersApi.delete(`/users/${id}`);
    return response.data;
};

// --- PRODUCTOS ---
export const getProducts = async () => {
    const response = await productsApi.get('/products');
    return response.data;
};

export const getProductById = async (id) => {
    const response = await productsApi.get(`/products/${id}`);
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await productsApi.post('/products', productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await productsApi.put(`/products/${id}`, productData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await productsApi.delete(`/products/${id}`);
    return response.data;
};

export const getCategories = async () => {
    const response = await productsApi.get('/categories');
    return response.data;
};

// --- VENTAS ---
export const createSale = async (saleData) => {
    const response = await usersApi.post('/sales', saleData);
    return response.data;
};

export const getSales = async () => {
    const response = await usersApi.get('/sales');
    return response.data;
};

// --- REPORTES ---
export const getDashboardStats = async () => {
    const response = await usersApi.get('/reports/dashboard');
    return response.data;
};

// --- API EXTERNA (RAWG) HU15 ---
const RAWG_API_KEY = 'd2f4dd9b9bdc4f48a70b76c65f9a8eff';
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export const searchGameExternal = async (query) => {
    try {
        // Buscamos el juego en la API externa
        const response = await axios.get(`${RAWG_BASE_URL}/games`, {
            params: {
                key: RAWG_API_KEY,
                search: query,
                page_size: 1 // Solo queremos el primer resultado más relevante
            }
        });

        if (response.data.results.length > 0) {
            const game = response.data.results[0];
            // Mapeamos los datos de RAWG a tu formato
            return {
                name: game.name,
                description: `Lanzamiento: ${game.released}. Rating: ${game.rating}/5. ${game.name} es un juego disponible en múltiples plataformas.`, // RAWG no da descripción completa en búsqueda simple, improvisamos un resumen útil.
                rating: game.rating,
                image_url: game.background_image,
                // Intentamos adivinar la categoría/plataforma (opcional)
                category_id: 1 // Por defecto Videojuego
            };
        }
        return null;
    } catch (error) {
        console.error("Error API RAWG:", error);
        return null;
    }
};

// --- NOTICIAS (HU16) ---
export const getGamingNews = async () => {
    // Pedimos al backend propio, no a NewsAPI directo
    const response = await usersApi.get('/news'); 
    return response.data;
};