import api from './api';

class UserService {
    /**
     * 📋 Listar usuarios (de la empresa actual)
     */
    static async getAll() {
        const { data } = await api.get('/users');
        return data;
    }

    /**
     * 🔍 Obtener usuario por ID
     */
    static async getById(id) {
        const { data } = await api.get(`/users/${id}`);
        return data;
    }

    /**
     * 👤 Crear usuario
     */
    static async create(payload) {
        /**
         * payload esperado:
         * {
         *   email,
         *   password,
         *   fullName,
         *   roleId,
         *   branchId
         * }
         */
        const { data } = await api.post('/users', payload);
        return data;
    }

    /**
     * ✏️ Actualizar usuario
     */
    static async update(id, payload) {
        console.log('Payload update USER:', payload);

        const { data } = await api.put(`/users/${id}`, payload);
        return data;
    }

    /**
     * 🔑 Cambiar contraseña (opcional pero recomendado)
     */
    static async changePassword(id, payload) {
        /**
         * payload:
         * {
         *   password
         * }
         */
        const { data } = await api.patch(`/users/${id}/password`, payload);
        return data;
    }

    /**
     * 🗑 Eliminar usuario
     */
    static async remove(id) {
        const { data } = await api.delete(`/users/${id}`);
        return data;
    }

    /**
     * ✅ Activar usuario
     */
    static async activate(id) {
        const { data } = await api.patch(`/users/${id}/activate`);
        return data;
    }

    /**
     * 🚫 Desactivar usuario
     */
    static async deactivate(id) {
        const { data } = await api.patch(`/users/${id}/deactivate`);
        return data;
    }
}

export default UserService;
