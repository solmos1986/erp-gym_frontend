<script setup>
import { useAuthStore } from '@/store/auth.store';
import { computed } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const auth = useAuthStore();

/**
 * MODELO ESTÁTICO (NO REACTIVO)
 */
const model = [
    {
        label: 'Plataforma',
        items: [
            {
                label: 'Empresas',
                icon: 'pi pi-building',
                to: '/platform/companies',
                permission: 'SYSTEM_COMPANIES_VIEW' // Permiso que controlará la visibilidad
            },
            {
                label: 'Roles',
                icon: 'pi pi-shield',
                to: '/platform/roles-tenant',
                permission: 'TENANT_ROLES_VIEW' // Permiso que controlará la visibilidad
            },
            // {
            //     label: 'Usuarios Staff',
            //     icon: 'pi pi-users',
            //     to: '/platform/users-staff',
            //     permission: 'PLATFORM_USERS_VIEW' // Permiso que controlará la visibilidad
            // },
            // {
            //     label: 'Roles Empresas',
            //     icon: 'pi pi-shield',
            //     to: '/platform/roles-erp',
            //     permission: 'ERP_ROLES_VIEW' // Permiso que controlará la visibilidad
            // },
            {
                label: 'Usuarios',
                icon: 'pi pi-users',
                to: '/platform/users-erp',
                permission: 'TENANT_USERS_VIEW' // Permiso que controlará la visibilidad
            },
            {
                label: 'Dispositivos',
                icon: 'pi pi-desktop',
                to: '/platform/devices',
                permission: 'TENANT_DEVICES_VIEW' // Permiso que controlará la visibilidad
            }
        ]
    },
    {
        label: 'ERP',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-chart-line',
                to: '/dashboard',
                permission: 'ERP_TREASURY_VIEW' // Permiso para ver el dashboard
            },
            // {
            //     label: 'Productos',
            //     icon: 'pi pi-box',
            //     to: '/products',
            //     permission: 'ERP_PRODUCTS_VIEW' // Permiso para productos
            // },
            {
                label: 'Clientes',
                icon: 'pi pi-users',
                to: '/partners',
                permission: 'TENANT_PARTNER_VIEW' // Permiso para ventas
            },
            {
                label: 'Planes',
                icon: 'pi pi-shopping-cart',
                to: '/plan',
                permission: 'TENANT_PLANS_VIEW' // Permiso para ventas
            },
            {
                label: 'Inscripciones',
                icon: 'pi pi-shopping-cart',
                to: '/memberships',
                permission: 'TENANT_MEMBERSHIP_VIEW' // Permiso para ventas
            },
            {
                label: 'Membresias Status',
                icon: 'pi pi-shopping-cart',
                to: '/memberships-status',
                permission: 'TENANT_MEMBERSHIP_VIEW' // Permiso para ventas
            }
            // {
            //     label: 'Ventas',
            //     icon: 'pi pi-arrow-up-right',
            //     to: '/sales',
            //     permission: 'ERP_SALES_VIEW' // Permiso para ventas
            // },
            // {
            //     label: 'Cajas',
            //     icon: 'pi pi-wallet',
            //     to: '/cash-boxes',
            //     permission: 'ERP_CASHBOX_VIEW' // Permiso para ventas
            // },
            // {
            //     label: 'Reporte_Cajas',
            //     icon: 'pi pi-file-pdf',
            //     to: '/cash-reports',
            //     permission: 'ERP_TREASURY_VIEW' // Permiso para ventas
            // },
            // {
            //     label: 'Tesoreria',
            //     icon: 'pi pi-dollar',
            //     to: '/cash-movements',
            //     permission: 'ERP_TREASURY_VIEW' // Permiso para ventas
            // },
            // {
            //     label: 'Compras',
            //     icon: 'pi pi-arrow-down-left',
            //     to: '/purchases',
            //     permission: 'ERP_PURCHASES_VIEW' // Permiso para ventas
            // }
        ]
    }
];

/**
 * 🔥 FILTRO PURO (SIN MUTAR)
 */
function filterMenu(items) {
    //console.log('permisos que llegan a filterMenu: ', items);

    return items
        .map((item) => {
            // Si es un agrupador (tiene items), solo filtramos los ítems dentro de él
            if (item.items) {
                // Filtramos los ítems dentro del grupo
                const children = filterMenu(item.items);

                // Verifica si hay ítems visibles después del filtrado
                const hasVisibleItems = children.length > 0;

                // Si el grupo no tiene ítems visibles, lo eliminamos
                if (!hasVisibleItems) {
                    return null;
                }

                return {
                    ...item,
                    items: children // Aquí mantenemos los ítems filtrados dentro del grupo
                };
            }

            // Si no tiene ítems, simplemente aplica la verificación del permiso
            const hasPermission = !item.permission || auth.can(item.permission);
            //console.log(`Permission for ${item.label}: ${hasPermission}`); // Ver si tiene permiso

            // Si no tiene permiso, no lo mostramos
            return hasPermission ? item : null;
        })
        .filter(Boolean); // Filtra los nulls (cuando no hay permisos o hijos)
}

/**
 * MENÚ FINAL (filtrado por permisos)
 */
const filteredModel = computed(() => filterMenu(model));
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, index) in filteredModel" :key="index">
            <app-menu-item :item="item" :index="index" />
        </template>
    </ul>
</template>

<style scoped></style>
