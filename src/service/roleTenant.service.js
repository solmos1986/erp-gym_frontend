import api from '../service/api';

const API_URL = '/tenant-roles'; // Aquí pon la URL base de tu API

class roleTenantService {
    // Obtener todos los roles
    static async getAll() {
        try {
            const response = await api.get(API_URL);
            console.log('llegue a try getAll tenantRoles', response.data);
            return response.data; // Asumimos que los datos vienen en el campo 'data'
        } catch (error) {
            console.error('Error al obtener tenantRoles:', error);
            throw error;
        }
    }

    // Obtener un solo rol por ID
    static async getById(id) {
        try {
            const response = await api.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener tenantRoles:', error);
            throw error;
        }
    }

    // Obtener roles por companyId
    static async getByCompanyId(companyId) {
        try {
            console.log('llegue a roles getByCompanyId', companyId);
            const response = await api.get(`${API_URL}/company/${companyId}`); // Ruta ajustada para obtener roles por companyId
            return response.data;
        } catch (error) {
            console.error('Error al obtener tenantRoles por companyId:', error);
            throw error;
        }
    }

    // Crear un nuevo rol
    static async create(roleData) {
        try {
            console.log('create rol', roleData);
            const response = await api.post(`${API_URL}/create`, roleData); // Ruta ajustada para crear un rol
            return response.data;
        } catch (error) {
            console.error('Error al crear tenantRoles:', error);
            throw error;
        }
    }

    // Actualizar un rol existente
    static async update(id, roleData) {
        try {
            console.log('editar rolSaas ', roleData);
            const response = await api.put(`${API_URL}/${id}`, roleData); // Ruta ajustada para actualizar un rol
            return response.data;
        } catch (error) {
            console.error('Error al actualizar tenantRoles:', error);
            throw error;
        }
    }

    // Eliminar un rol
    static async remove(data) {
        console.log('eliminar rolSaas ', data);
        try {
            const response = await api.delete(`${API_URL}/delete`, { data }); // Ruta ajustada para eliminar un rol
            return response.data;
        } catch (error) {
            console.error('Error al eliminar tenantRoles:', error);
            throw error;
        }
    }
}

// Exportación por defecto del objeto que contiene todas las funciones
export default roleTenantService;
