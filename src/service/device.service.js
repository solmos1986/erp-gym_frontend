import api from './api';

class DeviceService {
    /**
     * 📋 Listar devices
     */
    static async getAll() {
        const { data } = await api.get('/devices');
        return data;
    }

    /**
     * 🔍 Obtener device por ID
     */
    static async getById(id) {
        const { data } = await api.get(`/devices/${id}`);
        return data;
    }

    /**
     * 🖥️ Crear device
     */
    static async create(payload) {
        const { data } = await api.post('/devices', payload);
        return data;
    }

    /**
     * ✏️ Actualizar device
     */
    static async update(id, payload) {
        console.log('Payload update device:', payload); // debug
        const { data } = await api.put(`/devices/${id}`, payload);
        return data;
    }

    /**
     * 🗑 Eliminar device (soft delete)
     */
    static async remove(id) {
        const { data } = await api.delete(`/devices/${id}`);
        return data;
    }

    /**
     * 🧪 Test conexión (BONUS futuro)
     */
    static async testConnection(id) {
        const { data } = await api.post(`/devices/${id}/test`);
        return data;
    }
}

export default DeviceService;
