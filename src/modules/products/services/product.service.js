import api from '../../../service/api';

class ProductService {
    /**
     * 📋 Listar productos
     */
    static async getAll(params = {}) {
        const { data } = await api.get('/products', { params });
        return data;
    }

    /**
     * 🔍 Obtener producto
     */
    static async getById(id) {
        const { data } = await api.get(`/products/${id}`);
        return data;
    }

    /**
     * ➕ Crear producto
     */
    static async create(payload) {
        const { data } = await api.post('/products', payload);
        return data;
    }

    /**
     * ✏️ Actualizar producto
     */
    static async update(id, payload) {
        const { data } = await api.put(`/products/${id}`, payload);
        return data;
    }

    /**
     * ❌ Desactivar producto
     */
    static async remove(id) {
        const { data } = await api.delete(`/products/${id}`);
        return data;
    }

    /**
     * ✅ Activar producto
     */
    static async activate(id) {
        const { data } = await api.put(`/products/${id}/activate`);
        return data;
    }
}

export default ProductService;
