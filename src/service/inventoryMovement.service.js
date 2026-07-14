import api from './api';

class InventoryMovementService {
    /**
     * 📋 Listar movimientos
     */
    static async getAll(params = {}) {
        const { data } = await api.get('/inventory-movements', { params });

        return data;
    }

    /**
     * 🔍 Obtener movimiento
     */
    static async getById(id) {
        const { data } = await api.get(`/inventory-movements/${id}`);

        return data;
    }

    /**
     * ➕ Crear movimiento
     */
    static async create(payload) {
        const { data } = await api.post('/inventory-movements', payload);

        return data;
    }
}

export default InventoryMovementService;
