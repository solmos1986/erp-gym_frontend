import api from './api';

class PurchaseService {
    // =========================
    // 🛒 CREAR COMPRA
    // =========================
    static async create(payload) {
        const { data } = await api.post('/purchases', payload);
        return data;
    }
    // =========================
    // 📋 LISTAR COMPRAS
    // =========================
    static async getAll(params = {}) {
        const { data } = await api.get('/purchases', {
            params
        });

        return data;
    }

    // =========================
    // 🔍 OBTENER COMPRA
    // =========================
    static async getById(id) {
        const { data } = await api.get(`/purchases/${id}`);
        return data;
    }

    // =========================
    // ❌ ANULAR COMPRA
    // =========================
    static async cancel(id) {
        const { data } = await api.post(`/purchases/${id}/cancel`);

        return data;
    }
}

export default PurchaseService;
