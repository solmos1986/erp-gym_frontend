import { createRouter, createWebHistory } from 'vue-router';
import { authGuard, guestGuard, permissionGuard } from './guards';

const routes = [
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/views/auth/Login.vue'),
        beforeEnter: guestGuard
    },

    // 🔵 PLATFORM
    {
        path: '/platform',
        component: () => import('@/layout/AppLayout.vue'),
        //beforeEnter: authGuard,
        children: [
            {
                path: 'companies',
                component: () => import('@/views/platform/Empresas.vue'),
                beforeEnter: permissionGuard('SYSTEM_COMPANIES_VIEW')
            },
            {
                path: 'business-templates',
                component: () => import('@/views/platform/BusinessTemplate.vue'),
                beforeEnter: permissionGuard('SYSTEM_COMPANIES_VIEW')
            },
            {
                path: 'permissions',
                component: () => import('@/views/platform/Permissions.vue'),
                beforeEnter: permissionGuard('SYSTEM_COMPANIES_VIEW')
            },
            // {
            //     path: 'users-staff',
            //     component: () => import('@/views/platform/UserStaff.vue'),
            //     beforeEnter: permissionGuard('PLATFORM_USERS_VIEW')
            // },
            {
                path: 'roles-tenant',
                component: () => import('@/views/platform/RoleTenant.vue'),
                beforeEnter: permissionGuard('TENANT_ROLES_VIEW')
            },
            {
                path: 'users-erp',
                component: () => import('@/views/platform/UserErp.vue'),
                beforeEnter: permissionGuard('TENANT_USERS_VIEW')
            }
        ]
    },

    // 🟢 ERP
    {
        path: '/',
        component: () => import('@/layout/AppLayout.vue'),
        beforeEnter: authGuard,
        children: [
            {
                path: 'dashboard',
                component: () => import('@/views/pages/pos/Dashboard.vue'),
                beforeEnter: permissionGuard('TENANT_DASHBOARD_VIEW')
            },
            {
                path: '',
                redirect: '/dashboard' //aqui cambiar por la vista DASHBOARD
            },
            {
                path: 'partners',
                component: () => import('@/views/pages/pos/Clientes.vue'),
                beforeEnter: permissionGuard('TENANT_PARTNER_VIEW')
            },
            {
                path: 'plan',
                component: () => import('@/views/pages/pos/Planes.vue'),
                beforeEnter: permissionGuard('TENANT_PLANS_VIEW')
            },
            {
                path: 'memberships',
                component: () => import('@/views/pages/pos/Membresias.vue'),
                beforeEnter: permissionGuard('TENANT_MEMBERSHIP_VIEW')
            },
            {
                path: 'memberships-status',
                component: () => import('@/views/pages/pos/CustomerMembership.vue'),
                beforeEnter: permissionGuard('TENANT_MEMBERSHIP_VIEW')
            },

            // 🔥 FIX IMPORTANTE
            {
                path: 'platform/devices',
                component: () => import('@/views/platform/Devices.vue')
                //beforeEnter: permissionGuard('TENANT_DEVICES_VIEW')
            },
            {
                path: '/inventory',
                name: 'inventory',

                component: () => import('@/views/inventory/InventoryDashboard.vue'),

                meta: {
                    permission: 'TENANT_INVENTORY_VIEW'
                }
            }
        ]
    },
    {
        path: '/warehouse',
        component: () => import('@/layout/AppLayout.vue'),
        //beforeEnter: authGuard,
        children: [
            {
                path: 'product-categories',
                component: () => import('@/views/pages/warehouse/ProductCategories.vue'),
                beforeEnter: permissionGuard('TENANT_PRODUCT_CATEGORIES_VIEW')
            },
            {
                path: 'products',
                component: () => import('@/modules/products/views/Products.vue'),
                beforeEnter: permissionGuard('TENANT_PRODUCTS_VIEW')
            },
            {
                path: 'stock',
                component: () => import('@/views/pages/warehouse/Stock.vue'),
                beforeEnter: permissionGuard('TENANT_INVENTORY_VIEW')
            },
            {
                path: 'movements',
                component: () => import('@/views/pages/warehouse/Movements.vue'),
                beforeEnter: permissionGuard('TENANT_INVENTORY_VIEW')
            },
            {
                path: 'kardex',
                component: () => import('@/views/pages/warehouse/Kardex.vue'),
                beforeEnter: permissionGuard('TENANT_INVENTORY_VIEW')
            }
        ]
    },
    {
        path: '/cash-register',
        component: () => import('@/layout/AppLayout.vue'),
        children: [
            {
                path: 'current',
                component: () => import('@/views/pages/cash/CashRegister.vue'),
                beforeEnter: permissionGuard('TENANT_CASH_VIEW')
            }
        ]
    },
    {
        path: '/product-sales',
        component: () => import('@/layout/AppLayout.vue'),
        children: [
            {
                path: '',
                component: () => import('@/views/pages/pos/ProductSale.vue'),
                beforeEnter: permissionGuard('TENANT_SALES_VIEW')
            }
        ]
    },
    {
        path: '/purchases',
        component: () => import('@/layout/AppLayout.vue'),
        children: [
            {
                path: '',
                component: () => import('@/views/pages/pos/ProductPurchase.vue'),
                beforeEnter: permissionGuard('TENANT_PURCHASES_VIEW')
            }
        ]
    },
    {
        path: '/reports',
        component: () => import('@/layout/AppLayout.vue'),
        children: [
            {
                path: 'sales',
                component: () => import('@/views/reports/SalesReport.vue'),
                beforeEnter: permissionGuard('TENANT_REPORT_VIEW')
            },
            {
                path: 'cash',
                component: () => import('@/views/reports/CashReport.vue'),
                beforeEnter: permissionGuard('TENANT_REPORT_VIEW')
            },
            {
                path: 'cash/:id',
                component: () => import('@/views/reports/CashDetailReport.vue'),
                beforeEnter: permissionGuard('TENANT_REPORT_VIEW')
            },
            {
                path: 'memberships',
                component: () => import('@/views/reports/MembershipReport.vue'),
                beforeEnter: permissionGuard('TENANT_REPORT_VIEW')
            },
            {
                path: 'inventory',
                component: () => import('@/views/reports/InventoryReport.vue'),
                beforeEnter: permissionGuard('TENANT_REPORT_VIEW')
            },
            {
                path: 'purchases',
                component: () => import('@/views/reports/PurchaseReport.vue'),
                beforeEnter: permissionGuard('TENANT_REPORT_VIEW')
            },
            {
                path: 'profitability',
                component: () => import('@/views/reports/ProfitabilityReport.vue'),
                beforeEnter: permissionGuard('TENANT_REPORT_VIEW')
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(), // ✅ ya correcto para evitar errores
    routes
});

export default router;
