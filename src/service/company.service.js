import api from './api';

class CompanyService {
    /**
     * 📋 Listar empresas
     */
    static async getAll() {
        const { data } = await api.get('/companies');
        return data;
    }

    /**
     * 🔍 Obtener empresa por ID
     */
    static async getById(id) {
        const { data } = await api.get(`/companies/${id}`);
        return data;
    }

    /**
     * 🏢 Crear empresa (ONBOARDING)
     */
    static async create(payload) {
        const { data } = await api.post('/companies/register', payload);
        return data;
    }

    /**
     * ✏️ Actualizar empresa
     */
    static async update(id, payload) {
        const { data } = await api.put(`/companies/${id}`, payload);
        return data;
    }

    /**
     * 🖼️ Subir logo (🔥 NUEVO)
     */
    static async uploadLogo(companyId, formData) {
        const { data } = await api.post(`/companies/${companyId}/logo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return data;
    }

    /**
     * 🗑 Eliminar empresa
     */
    static async remove(id) {
        const { data } = await api.delete(`/companies/${id}`);
        return data;
    }

    /**
     * ✅ Activar empresa
     */
    static async activate(id) {
        const { data } = await api.patch(`/companies/${id}/activate`);
        return data;
    }
}

export default CompanyService;
