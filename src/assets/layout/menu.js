import { useAuthStore } from '../../store/auth.store';

export function useMenu() {
    const auth = useAuthStore();

    return [
        {
            label: 'Empresas',
            icon: 'pi pi-building',
            visible: auth.can('COMPANIES_CRUD'),
            to: '/companies'
        },
        {
            label: 'Sucursales',
            icon: 'pi pi-sitemap',
            visible: auth.can('BRANCHES_CRUD'),
            to: '/branches'
        },
        {
            label: 'Usuarios',
            icon: 'pi pi-users',
            visible: auth.can('USERS_CRUD'),
            to: '/users'
        },
        {
            label: 'Roles',
            icon: 'pi pi-lock',
            visible: auth.can('ROLES_CRUD'),
            to: '/roles'
        }
    ].filter((item) => item.visible);
}
