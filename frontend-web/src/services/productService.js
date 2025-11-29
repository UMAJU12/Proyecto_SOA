// src/services/productService.js
import { productsAPI } from '../utils/axios';

const productService = {
  // Obtener todos los productos
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.name) params.append('name', filters.name);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.platform_id) params.append('platform_id', filters.platform_id);
      if (filters.genre_id) params.append('genre_id', filters.genre_id);
      if (filters.product_type) params.append('product_type', filters.product_type);

      const queryString = params.toString();
      const url = queryString ? `/products?${queryString}` : '/products';
      
      const response = await productsAPI.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener producto por ID
  getById: async (id) => {
    try {
      const response = await productsAPI.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Crear producto
  create: async (productData) => {
    try {
      const response = await productsAPI.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Actualizar producto
  update: async (id, productData) => {
    try {
      const response = await productsAPI.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar producto
  delete: async (id) => {
    try {
      const response = await productsAPI.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener categorías, plataformas y géneros (helpers)
  getCategories: () => [
    { id: 1, name: 'Videojuegos' },
    { id: 2, name: 'Consolas' },
    { id: 3, name: 'Accesorios' },
    { id: 4, name: 'Merchandising' },
    { id: 5, name: 'Componentes' }
  ],

  getPlatforms: () => [
    { id: 1, name: 'PlayStation 5' },
    { id: 2, name: 'Xbox Series X/S' },
    { id: 3, name: 'Nintendo Switch' },
    { id: 4, name: 'PC' },
    { id: 5, name: 'PlayStation 4' }
  ],

  getGenres: () => [
    { id: 1, name: 'Acción' },
    { id: 2, name: 'RPG' },
    { id: 3, name: 'Deportes' },
    { id: 4, name: 'Shooter' },
    { id: 5, name: 'Aventura' }
  ],

  getProductTypes: () => [
    { value: 'videojuego_fisico', label: 'Videojuego Físico' },
    { value: 'videojuego_digital', label: 'Videojuego Digital' },
    { value: 'consola', label: 'Consola' },
    { value: 'accesorio', label: 'Accesorio' },
    { value: 'merchandising', label: 'Merchandising' }
  ]
};

export default productService;