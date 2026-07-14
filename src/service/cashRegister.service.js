import api from './api';

class CashRegisterService {
    /**
     * 📋 Listar cajas
     */
    static async getAll(params = {}) {
        const { data } = await api.get('/cash-registers', { params });

        return data;
    }

    /**
     * 🔍 Obtener caja
     */
    static async getById(id) {
        const { data } = await api.get(`/cash-registers/${id}`);

        return data;
    }

    /**
     * 🟢 Caja actual
     */
    static async getCurrent() {
        const { data } = await api.get('/cash-registers/current');

        return data;
    }

    /**
     * 🔓 Abrir caja
     */
    static async open(payload) {
        const { data } = await api.post('/cash-registers/open', payload);

        return data;
    }

    /**
     * 🔒 Cerrar caja
     */
    static async close(id, payload) {
        const { data } = await api.post(`/cash-registers/${id}/close`, payload);

        return data;
    }
    /**
     * 📊 Resumen caja actual
     */
    static async getSummary() {
        const { data } = await api.get('/cash-registers/current/summary');

        return data;
    }
}

export default CashRegisterService;
