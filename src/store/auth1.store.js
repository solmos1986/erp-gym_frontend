import { defineStore } from 'pinia';
import { login as loginService } from '../service/auth.service';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token'),
        permissions: [],
        isSuperAdmin: false,
        user: null, // { id, companyId, branchId }
        initialized: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,

        can: (state) => (permission) => {
            if (state.isSuperAdmin) return true;
            if (!permission) return false;
            return state.permissions.includes(permission);
        }
    },

    actions: {
        // =========================
        // 🔁 Inicializa el auth desde localStorage
        // =========================
        initAuth() {
            if (!this.token) {
                this.initialized = true;
                return;
            }

            try {
                const payload = JSON.parse(atob(this.token.split('.')[1]));

                this.permissions = payload.permissions || [];
                this.isSuperAdmin = payload.isSuperAdmin || false;

                this.user = {
                    id: payload.sub,
                    companyId: payload.companyId || null,
                    branchId: payload.branchId || null
                };

                // Opcional: validar expiración
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp && payload.exp < now) {
                    this.logout();
                }
            } catch (error) {
                console.error('Token inválido:', error);
                this.logout();
            } finally {
                this.initialized = true;
            }
        },

        // =========================
        // 🔐 Login
        // =========================
        async login(credentials) {
            try {
                const response = await loginService(credentials);
                const { token } = response.data;

                if (!token) throw new Error('No token received');

                this.token = token;
                localStorage.setItem('token', token);

                const payload = JSON.parse(atob(token.split('.')[1]));

                this.permissions = payload.permissions || [];
                this.isSuperAdmin = payload.isSuperAdmin || false;

                this.user = {
                    id: payload.sub,
                    companyId: payload.companyId || null,
                    branchId: payload.branchId || null
                };

                console.log('Auth user loaded:', this.user);
            } catch (error) {
                console.error('Error al hacer login:', error);
                throw error;
            }
        },

        // =========================
        // 🚪 Logout
        // =========================
        logout() {
            this.$reset();
            localStorage.removeItem('token');
        }
    }
});
