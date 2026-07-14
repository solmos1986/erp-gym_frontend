<script setup>
import { onMounted, ref } from 'vue';

import DashboardService from '../../service/dashboard.service';

const summary = ref({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,

    activeCustomers: 0,
    membershipsExpiringSoon: 0,

    todayRegistrations: 0,
    weekRegistrations: 0,
    monthRegistrations: 0
});

const loading = ref(false);

//////////////////////////////////////
// LOAD SUMMARY
//////////////////////////////////////
const loadSummary = async () => {
    try {
        loading.value = true;

        const data = await DashboardService.getSummary();
        console.log(data);
        summary.value = data;
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadSummary();
});
</script>

<template>
    <!-- 💰 REVENUE -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Usuario</span>

                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">Bs {{ summary.todayRevenue }}</div>
                </div>

                <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-dollar text-green-500 !text-xl"></i>
                </div>
            </div>

            <span class="text-muted-color">Ventas registradas hoy</span>
        </div>
    </div>

    <!-- 📅 TODAY -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Inscripciones Hoy</span>

                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                        {{ summary.todayRegistrations }}
                    </div>
                </div>

                <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-calendar text-purple-500 !text-xl"></i>
                </div>
            </div>

            <span class="text-muted-color">Registradas hoy</span>
        </div>
    </div>
    <!-- 👥 ACTIVE CUSTOMERS -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Clientes Activos</span>

                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                        {{ summary.activeCustomers }}
                    </div>
                </div>

                <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-users text-cyan-500 !text-xl"></i>
                </div>
            </div>

            <span class="text-muted-color">Membresías activas</span>
        </div>
    </div>

    <!-- ⚠️ EXPIRING -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Por Vencer</span>

                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                        {{ summary.membershipsExpiringSoon }}
                    </div>
                </div>

                <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-exclamation-triangle text-orange-500 !text-xl"></i>
                </div>
            </div>

            <span class="text-muted-color">Vencen en 3 días</span>
        </div>
    </div>

    <!-- 💰 WEEK REVENUE -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Ingresos Semana</span>

                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">Bs {{ summary.weekRevenue }}</div>
                </div>

                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-chart-line text-blue-500 !text-xl"></i>
                </div>
            </div>

            <span class="text-muted-color">Acumulado semanal</span>
        </div>
    </div>

    <!-- 📅 WEEK -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Inscripciones Semana</span>

                    <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">
                        {{ summary.weekRegistrations }}
                    </div>
                    <span class="text-muted-color">Registradas esta semana</span>
                </div>

                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 3rem; height: 3rem">
                    <i class="pi pi-chart-line text-blue-500 !text-2xl"></i>
                </div>
            </div>
        </div>
    </div>
    <!-- 💰 MONTH REVENUE -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Ingresos Mes</span>

                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">Bs {{ summary.monthRevenue }}</div>
                </div>

                <div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-chart-bar text-indigo-500 !text-xl"></i>
                </div>
            </div>

            <span class="text-muted-color">Acumulado mensual</span>
        </div>
    </div>
    <!-- 📅 MONTH -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Inscripciones Mes</span>

                    <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">
                        {{ summary.monthRegistrations }}
                    </div>
                </div>

                <div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-400/10 rounded-border" style="width: 3rem; height: 3rem">
                    <i class="pi pi-chart-bar text-indigo-500 !text-2xl"></i>
                </div>
            </div>
            <span class="text-muted-color">Registradas este mes</span>
        </div>
    </div>
</template>
