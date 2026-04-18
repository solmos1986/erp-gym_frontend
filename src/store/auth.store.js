import { defineStore } from 'pinia';
import { login as loginService, me as meService } from '../service/auth.service';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token'),
        permissions: [],
        user: null,
        initialized: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,

        isReady: (state) => state.initialized,

        can: (state) => (permission) => {
            if (!permission) return false;

            // 🔥 SUPER ADMIN bypass (opcional)
            if (state.user?.systemRoles?.includes('SUPER_ADMIN')) return true;

            return state.permissions.includes(permission);
        }
    },

    actions: {
        // =========================
        // 🔁 INIT AUTH
        // =========================
        async initAuth() {
            if (!this.token) {
                this.initialized = true;
                return;
            }

            try {
                const { data } = await meService();

                // 🔥 ADAPTADO A TU BACKEND REAL
                this.user = data.user || data;

                this.permissions = data.permissions || [];
            } catch (error) {
                console.error('Error initAuth:', error);

                // 🔥 si token inválido → logout automático
                this.logout();
            } finally {
                this.initialized = true;
            }
        },

        // =========================
        // 🔐 LOGIN
        // =========================
        async login(credentials) {
            console.log('Intentando login con:', credentials);
            try {
                const { data } = await loginService(credentials);

                const { token } = data;

                if (!token) throw new Error('No token received');

                this.token = token;
                localStorage.setItem('token', token);

                // 🔥 cargar datos reales
                await this.initAuth();
            } catch (error) {
                console.error('Error login:', error);
                throw error;
            }
        },

        // =========================
        // 🚪 LOGOUT
        // =========================
        logout() {
            this.token = null;
            this.permissions = [];
            this.user = null;
            this.initialized = false;

            localStorage.removeItem('token');
        }
    }
});
