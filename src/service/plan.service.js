import api from './api';

class PlanService {
    /**
     * 📋 Listar planes
     * (puede recibir filtro opcional: isActive)
     */
    static async getAll(params = {}) {
        const { data } = await api.get('/plan', { params });
        return data;
    }

    /**
     * 🔍 Obtener plan por ID
     */
    static async getById(id) {
        const { data } = await api.get(`/plan/${id}`);
        return data;
    }

    /**
     * ➕ Crear plan
     */
    static async create(payload) {
        const { data } = await api.post('/plan', payload);
        return data;
    }

    /**
     * ✏️ Actualizar plan
     */
    static async update(id, payload) {
        console.log('Payload a enviar a update PLAN:', payload); // Debug
        const { data } = await api.put(`/plan/${id}`, payload);
        return data;
    }

    /**
     * ❌ Desactivar plan (soft delete)
     */
    static async remove(id) {
        const { data } = await api.delete(`/plan/${id}`);
        return data;
    }

    /**
     * 🔄 Activar plan (opcional - si lo implementas backend)
     */
    static async activate(id) {
        const { data } = await api.patch(`/plan/${id}/activate`);
        return data;
    }
}

export default PlanService;
