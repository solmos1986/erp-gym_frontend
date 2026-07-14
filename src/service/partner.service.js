import api from './api';

class PartnerService {
    /**
     * 📋 Listar clientes (partners)
     * puedes pasar filtros opcionales (isActive, search, etc)
     */
    static async getAll(params = {}) {
        console.log('Fetching partners with params:', params); // debug opcional
        const { data } = await api.get('/partners', { params });
        return data;
    }

    /**
     * 🔍 Obtener cliente por ID
     */
    static async getById(id) {
        const { data } = await api.get(`/partners/${id}`);
        return data;
    }

    /**
     * ➕ Crear cliente
     * payload:
     * {
     *   name,
     *   document,
     *   phone,
     *   email,
     *   address,
     *   type,
     *   imageUrl (opcional)
     * }
     */
    static async create(payload) {
        const { data } = await api.post('/partners', payload);
        return data;
    }

    /**
     * ✏️ Actualizar cliente
     */
    static async update(id, payload) {
        console.log('Payload UPDATE PARTNER:', payload); // debug opcional
        const { data } = await api.put(`/partners/${id}`, payload);
        return data;
    }

    /**
     * ❌ Desactivar cliente (soft delete)
     */
    static async remove(id) {
        const { data } = await api.delete(`/partners/${id}`);
        return data;
    }

    /**
     * 🖼️ Agregar imagen al cliente
     * payload:
     * {
     *   url,
     *   isMain (boolean)
     * }
     */
    static async addImage(partnerId, formData) {
        const { data } = await api.post(`/partners/${partnerId}/image`, formData);
        return data;
    }

    /**
     * ⭐ Cambiar imagen principal (helper opcional frontend)
     * (usa addImage con isMain = true)
     */

    static async activate(id) {
        const { data } = await api.put(`/partners/${id}/activate`);
        return data;
    }

    /**
     * 📥 Importar clientes desde Excel
     */
    static async importExcel(formData) {
        const { data } = await api.post('/partners/import-excel', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return data;
    }
}

export default PartnerService;
