import api from '../service/api';

const API_URL = '/tenant-permissions';

class PermissionTenantService {
    static async getAll() {
        try {
            const response = await api.get(API_URL);
            return response.data;
        } catch (error) {
            console.error('Error al obtener permisos:', error);
            throw error;
        }
    }

    // 🔥 alias limpio
    static async getTenantPermissions() {
        return this.getAll();
    }

    static async getById(id) {
        try {
            const response = await api.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener permiso:', error);
            throw error;
        }
    }

    static async create(data) {
        try {
            const response = await api.post(API_URL, data);
            return response.data;
        } catch (error) {
            console.error('Error al crear permiso:', error);
            throw error;
        }
    }

    static async update(id, data) {
        try {
            const response = await api.put(`${API_URL}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar permiso:', error);
            throw error;
        }
    }

    static async remove(id) {
        try {
            const response = await api.delete(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar permiso:', error);
            throw error;
        }
    }
}

export default PermissionTenantService;
