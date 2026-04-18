export const menuItems = [
    {
        label: 'Dashboard',
        icon: 'pi pi-home',
        to: '/'
    },
    {
        label: 'Administración',
        icon: 'pi pi-cog',
        permission: 'USERS_CRUD',
        items: [
            {
                label: 'Usuarios',
                to: '/users',
                permission: 'USERS_CRUD'
            },
            {
                label: 'Roles',
                to: '/roles',
                permission: 'ROLES_CRUD'
            }
        ]
    }
];
