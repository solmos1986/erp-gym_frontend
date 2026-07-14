import api from './api';

class BusinessTemplateService {
    /**
     * 📋 Listar templates
     */
    static async getAll() {
        const { data } = await api.get('/business-templates');
        return data;
    }

    /**
     * 🔍 Obtener template por ID
     */
    static async getById(id) {
        const { data } = await api.get(`/business-templates/${id}`);
        return data;
    }
    /**
     * 🔍 Crear template
     */
    static async create(payload) {
        const { data } = await api.post('/business-templates', payload);
        return data;
    }
    /**
     * 🔍 Actualizar template
     */
    static async update(id, payload) {
        const { data } = await api.put(`/business-templates/${id}`, payload);
        return data;
    }
    /**
     * 🔍 Obtener template por ID
     */
    static async toggle(id) {
        const { data } = await api.patch(`/business-templates/${id}/toggle`);
        return data;
    }

    static async createRole(templateId, payload) {
        const { data } = await api.post(`/business-templates/${templateId}/roles`, payload);

        return data;
    }

    static async updateRole(templateId, roleId, payload) {
        const { data } = await api.put(`/business-templates/${templateId}/roles/${roleId}`, payload);

        return data;
    }

    static async deleteRole(templateId, roleId) {
        const { data } = await api.delete(`/business-templates/${templateId}/roles/${roleId}`);

        return data;
    }
}

export default BusinessTemplateService;
