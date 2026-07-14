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
        label: 'DASHBOARD',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-home',
                to: '/dashboard',
                permission: 'TENANT_DASHBOARD_VIEW'
            },
            {
                label: 'Inventario',
                icon: 'pi pi-box',
                to: '/inventory',
                permission: 'TENANT_INVENTORY_VIEW'
            }
        ]
    },
    {
        label: 'ADMINISTRACION',
        items: [
            {
                label: 'Empresas',
                icon: 'pi pi-building',
                to: '/platform/companies',
                permission: 'SYSTEM_COMPANIES_VIEW'
            },
            {
                label: 'Verticales',
                icon: 'pi pi-sitemap',
                to: '/platform/business-templates',
                permission: 'SYSTEM_COMPANIES_VIEW'
            },
            {
                label: 'Permisos',
                icon: 'pi pi-sitemap',
                to: '/platform/permissions',
                permission: 'SYSTEM_COMPANIES_VIEW'
            },
            {
                label: 'Roles',
                icon: 'pi pi-shield',
                to: '/platform/roles-tenant',
                permissions: ['TENANT_ROLES_VIEW', 'SYSTEM_COMPANIES_VIEW']
            },
            {
                label: 'Usuarios',
                icon: 'pi pi-users',
                to: '/platform/users-erp',
                permission: 'TENANT_USERS_VIEW'
            },
            {
                label: 'Dispositivos',
                icon: 'pi pi-desktop',
                to: '/platform/devices',
                permission: 'TENANT_DEVICES_VIEW'
            }
        ]
    },
    {
        label: 'MEMBRESIAS',
        items: [
            {
                label: 'Clientes',
                icon: 'pi pi-user',
                to: '/partners',
                permission: 'TENANT_PARTNER_VIEW'
            },
            {
                label: 'Planes',
                icon: 'pi pi-id-card',
                to: '/plan',
                permission: 'TENANT_PLANS_VIEW'
            },
            {
                label: 'Estado Membresias',
                icon: 'pi pi-calendar',
                to: '/memberships-status',
                permission: 'TENANT_MEMBERSHIP_VIEW'
            }
        ]
    },
    {
        label: 'VENTAS',
        items: [
            {
                label: 'Venta de Productos',
                icon: 'pi pi-shopping-cart',
                to: '/product-sales',
                permission: 'TENANT_SALES_VIEW'
            },
            {
                label: 'Inscripciones/Renovaciones',
                icon: 'pi pi-ticket',
                to: '/memberships',
                permission: 'TENANT_MEMBERSHIP_VIEW'
            }
        ]
    },
    {
        label: 'COMPRAS',
        items: [
            {
                label: 'Compra de Productos',
                icon: 'pi pi-shopping-bag',
                to: '/purchases',
                permission: 'TENANT_PURCHASES_VIEW'
            }
        ]
    },
    {
        label: 'ALMACEN',
        items: [
            {
                label: 'Categorias de Productos',
                icon: 'pi pi-tags',
                to: '/warehouse/product-categories',
                permission: 'TENANT_PRODUCT_CATEGORIES_VIEW'
            },
            {
                label: 'Productos',
                icon: 'pi pi-box',
                to: '/warehouse/products',
                permission: 'TENANT_PRODUCTS_VIEW'
            },
            {
                label: 'Stock',
                icon: 'pi pi-warehouse',
                to: '/warehouse/stock',
                permission: 'TENANT_INVENTORY_VIEW'
            },
            {
                label: 'Movimientos',
                icon: 'pi pi-arrow-right-arrow-left',
                to: '/warehouse/movements',
                permission: 'TENANT_INVENTORY_VIEW'
            },
            {
                label: 'Kardex',
                icon: 'pi pi-book',
                to: '/warehouse/kardex',
                permission: 'TENANT_INVENTORY_VIEW'
            }
        ]
    },
    {
        label: 'CAJA',
        items: [
            {
                label: 'Caja Actual',
                icon: 'pi pi-wallet',
                to: '/cash-register/current',
                permission: 'TENANT_CASH_VIEW'
            }
        ]
    },
    {
        label: 'REPORTES',
        items: [
            {
                label: 'Ventas',
                icon: 'pi pi-chart-bar',
                to: '/reports/sales',
                permission: 'TENANT_REPORT_VIEW'
            },
            {
                label: 'Caja',
                icon: 'pi pi-money-bill',
                to: '/reports/cash',
                permission: 'TENANT_REPORT_VIEW'
            },
            {
                label: 'Membresías',
                icon: 'pi pi-users',
                to: '/reports/memberships',
                permission: 'TENANT_REPORT_VIEW'
            },
            {
                label: 'Inventario',
                icon: 'pi pi-box',
                to: '/reports/inventory',
                permission: 'TENANT_REPORT_VIEW'
            },
            {
                label: 'Compras',
                icon: 'pi pi-shopping-bag',
                to: '/reports/purchases',
                permission: 'TENANT_REPORT_VIEW'
            },
            {
                label: 'Rentabilidad',
                icon: 'pi pi-chart-line',
                to: '/reports/profitability',
                permission: 'TENANT_REPORT_VIEW'
            }
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
