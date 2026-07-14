import api from './api';

class CashMovementService {
    /**
     * 📋 Listar movimientos
     */
    static async getAll(params = {}) {
        const { data } = await api.get('/cash-movements', { params });

        return data;
    }

    /**
     * 🔍 Obtener movimiento
     */
    static async getById(id) {
        const { data } = await api.get(`/cash-movements/${id}`);

        return data;
    }

    /**
     * ➕ Crear movimiento
     */
    static async create(payload) {
        const { data } = await api.post('/cash-movements', payload);

        return data;
    }

    /**
     * ❌ Anular movimiento
     */
    static async cancel(id) {
        const { data } = await api.post(`/cash-movements/${id}/cancel`);

        return data;
    }
}

export default CashMovementService;
