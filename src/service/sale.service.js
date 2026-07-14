import api from './api';

class SaleService {
    /**
     * 📋 Listar ventas
     */
    static async getAll(params = {}) {
        const { data } = await api.get('/sales', { params });

        return data;
    }

    /**
     * 🔍 Obtener detalle de venta
     */
    static async getById(id) {
        const { data } = await api.get(`/sales/${id}`);

        return data;
    }

    /**
     * Anular venta
     */
    static async annul(id) {
        const { data } = await api.post(`/sales/${id}/annul`);
        return data;
    }
}

export default SaleService;
