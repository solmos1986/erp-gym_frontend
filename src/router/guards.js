import { useAuthStore } from '../store/auth.store';

/**
 * Guard principal de autenticación
 * - Espera inicialización (F5)
 * - Requiere login
 */
export function authGuard(to, from, next) {
    const auth = useAuthStore();

    // 🔥 Esperar a que el auth se rehidrate desde el token
    if (!auth.initialized) {
        return next(false);
    }

    // ❌ No autenticado
    if (!auth.isAuthenticated) {
        return next('/auth/login');
    }

    next();
}

/**
 * Guard para páginas públicas (login, etc.)
 */
export function guestGuard(to, from, next) {
    const auth = useAuthStore();

    if (!auth.initialized) {
        return next(false);
    }

    // Si ya está logueado, no vuelve al login
    if (auth.isAuthenticated) {
        return next('/');
    }

    next();
}

/**
 * Guard por permiso granular
 */
export function permissionGuard(permission) {
    return (to, from, next) => {
        const auth = useAuthStore();

        if (!auth.initialized) {
            return next(false);
        }

        if (!auth.can(permission)) {
            return next('/403');
        }

        next();
    };
}

/**
 * ==========================
 * REFUERZO CONCEPTUAL CLAVE
 * ==========================
 *
 * Evita que:
 * - SuperAdmin entre al ERP operativo
 * - Usuario empresa entre a PLATFORM
 */
export function platformErpIsolationGuard(to, from, next) {
    const auth = useAuthStore();

    if (!auth.initialized) {
        return next(false);
    }

    const isPlatformRoute = to.path.startsWith('/platform');
    const isErpRoute = !isPlatformRoute && to.path !== '/';

    // 👑 SuperAdmin SOLO puede entrar a PLATFORM
    if (auth.isSuperAdmin && isErpRoute) {
        return next('/403');
    }

    // 👤 Usuario empresa NO puede entrar a PLATFORM
    if (!auth.isSuperAdmin && isPlatformRoute) {
        return next('/403');
    }

    next();
}
