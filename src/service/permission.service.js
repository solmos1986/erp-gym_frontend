import api from '../service/api';

const API_URL = '/permissions';

class PermissionService {
    static async getCatalog(scope = null) {
        const params = {};

        if (scope) {
            params.scope = scope;
        }

        const response = await api.get(`${API_URL}/catalog`, { params });

        return response.data;
    }

    static async getCompanyCatalog() {
        const response = await api.get(`${API_URL}/company-catalog`);
        return response.data;
    }

    static async getById(id) {
        const response = await api.get(`${API_URL}/${id}`);

        return response.data;
    }

    static async create(data) {
        const response = await api.post(API_URL, data);

        return response.data;
    }

    static async update(id, data) {
        const response = await api.put(`${API_URL}/${id}`, data);

        return response.data;
    }

    static async toggle(id) {
        const response = await api.patch(`${API_URL}/${id}/toggle`);

        return response.data;
    }
}

export default PermissionService;
