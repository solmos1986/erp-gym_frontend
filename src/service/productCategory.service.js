import api from './api';

class ProductCategoryService {
    /**
     * 📋 Listar categorías
     */
    static async getAll(params = {}) {
        const { data } = await api.get('/product-categories', { params });
        return data;
    }

    /**
     * 🔍 Obtener categoría por ID
     */
    static async getById(id) {
        const { data } = await api.get(`/product-categories/${id}`);
        return data;
    }

    /**
     * ➕ Crear categoría
     */
    static async create(payload) {
        const { data } = await api.post('/product-categories', payload);
        return data;
    }

    /**
     * ✏️ Actualizar categoría
     */
    static async update(id, payload) {
        console.log('Payload a enviar a update PRODUCT CATEGORY:', payload);

        const { data } = await api.put(`/product-categories/${id}`, payload);

        return data;
    }

    /**
     * ❌ Desactivar categoría
     */
    static async remove(id) {
        const { data } = await api.delete(`/product-categories/${id}`);

        return data;
    }

    /**
     * ✅ Activar categoría
     */
    static async activate(id) {
        const { data } = await api.put(`/product-categories/${id}/activate`);

        return data;
    }
}

export default ProductCategoryService;
