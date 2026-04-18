import api from './api';

// 🔐 LOGIN
export const login = (payload) => api.post('/auth/login', payload);

// 👤 ME (usuario + permisos)
export const me = () => api.get('/auth/me');

export default {
    login,
    me
};
