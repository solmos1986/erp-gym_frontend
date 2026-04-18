import axios from 'axios';
console.log('BASE URL:', import.meta.env.VITE_API_URL);
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('Token en interceptor:', token); // Debug: Verificar el token antes de agregarlo
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
