import api from './api';

class BranchService {
    /**
     * 📋 Listar sucursales
     */
    static async getAll() {
        const { data } = await api.get('/branches');
        return data;
    }

    /**
     * 🔍 Obtener sucursal por ID
     */
    static async getById(id) {
        const { data } = await api.get(`/branches/${id}`);
        return data;
    }

    /**
     * 🏢 Crear sucursal
     */
    static async create(payload) {
        /**
         * payload esperado:
         * {
         *   name
         * }
         * 👉 companyId NO se envía (lo maneja el backend con el token)
         */
        const { data } = await api.post('/branches', payload);
        return data;
    }

    /**
     * ✏️ Actualizar sucursal
     */
    static async update(id, payload) {
        console.log('Payload a enviar a update BRANCH:', payload);

        const { data } = await api.put(`/branches/${id}`, payload);
        return data;
    }

    /**
     * 🗑 Eliminar (desactivar) sucursal
     */
    static async remove(id) {
        const { data } = await api.delete(`/branches/${id}`);
        return data;
    }

    /**
     * ✅ Activar sucursal
     */
    static async activate(id) {
        const { data } = await api.patch(`/branches/${id}/activate`);
        return data;
    }

    /**
     * 🚫 Desactivar sucursal
     */
    static async deactivate(id) {
        const { data } = await api.patch(`/branches/${id}/deactivate`);
        return data;
    }
}

export default BranchService;
