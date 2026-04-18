import api from './api';

class MembershipService {
    /**
     * 📋 Historial de membresías (MembershipSale)
     */
    static async getAll(params) {
        const { data } = await api.get('/memberships', { params });
        return data;
    }

    /**
     * 🔍 Obtener detalle de una venta
     */
    static async getById(id) {
        const { data } = await api.get(`/memberships/${id}`);
        return data;
    }

    /**
     * 🔐 Estado actual del cliente (CustomerMembership)
     */
    static async getStatus(customerId) {
        const { data } = await api.get(`/memberships/status/${customerId}`);
        return data;
    }

    /**
     * 💰 Comprar / Renovar membresía
     */
    static async purchase(payload) {
        const { data } = await api.post('/memberships/purchase', payload);
        return data;
    }

    /**
     * ❌ Cancelar membresía (opcional - historial)
     */
    static async cancel(id) {
        const { data } = await api.delete(`/memberships/${id}`);
        return data;
    }

    /**
     * 🔐 Estado de todas las membresías
     */
    static async getAllStatus() {
        const { data } = await api.get('/memberships/status');
        return data;
    }
    static async retry(id) {
        const { data } = await api.post(`/memberships/${id}/retry`);
        return data;
    }

    static async getReportPDF(params) {
        const response = await api.get('/memberships/report/pdf', {
            params,
            responseType: 'blob' // 👈 CLAVE para PDFs
        });

        return response;
    }
}

export default MembershipService;
