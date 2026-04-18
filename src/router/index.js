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
            // {
            //     path: 'dashboard',
            //     component: () => import('@/views/erp/CashDashboard.vue'),
            //     beforeEnter: permissionGuard('ERP_TREASURY_VIEW')
            // },
            // {
            //     path: 'products',
            //     component: () => import('@/views/erp/Products.vue'),
            //     beforeEnter: permissionGuard('ERP_PRODUCTS_VIEW')
            // },
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
            }

            // {
            //     path: 'erp/saleticket',
            //     component: () => import('@/views/erp/SaleTicket.vue'),
            //     beforeEnter: permissionGuard('ERP_SALES_TICKET_VIEW')
            // },
            // {
            //     path: 'sales',
            //     component: () => import('@/views/erp/Sales.vue'),
            //     beforeEnter: permissionGuard('ERP_SALES_VIEW')
            // },
            // {
            //     path: 'open-cash-register',
            //     component: () => import('@/views/erp/OpenCashRegister.vue'),
            //     beforeEnter: permissionGuard('ERP_CASHBOX_VIEW')
            // },
            // {
            //     path: 'cash-boxes',
            //     component: () => import('@/views/erp/CashBox.vue'),
            //     beforeEnter: permissionGuard('ERP_CASHBOX_VIEW')
            // },
            // {
            //     path: 'cash-reports',
            //     component: () => import('@/views/erp/CashReport.vue'),
            //     beforeEnter: permissionGuard('ERP_TREASURY_VIEW')
            // },
            // {
            //     path: 'cash-movements',
            //     component: () => import('@/views/erp/CashLedger.vue'),
            //     beforeEnter: permissionGuard('ERP_TREASURY_VIEW')
            // },
            // {
            //     path: 'purchases',
            //     component: () => import('@/views/erp/PurchaseList.vue'),
            //     beforeEnter: permissionGuard('ERP_PURCHASES_VIEW')
            // }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(), // ✅ ya correcto para evitar errores
    routes
});

export default router;
