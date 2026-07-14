<script setup>
import InventoryService from '@/service/inventory.service';
import { onMounted, ref } from 'vue';

const dashboard = ref({
    activeProducts: 0,
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
    monthlySales: 0
});

async function loadData() {
    try {
        dashboard.value = await InventoryService.getDashboard();
    } catch (error) {
        console.error('Error cargando dashboard', error);
    }
}

function money(value) {
    return Number(value || 0).toLocaleString('es-BO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

onMounted(loadData);
</script>

<template>
    <!-- PRODUCTOS ACTIVOS -->

    <div class="col-span-12 lg:col-span-6 xl:col-span-2">
        <div class="card">
            <div class="flex items-center gap-4">
                <!-- Icono -->
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full flex-shrink-0" style="width: 4rem; height: 4rem">
                    <i class="pi pi-box text-blue-500 text-2xl"></i>
                </div>

                <!-- Texto -->
                <div>
                    <div class="text-muted-color font-medium text-sm">Productos Activos</div>

                    <div class="text-4xl font-bold mt-2">
                        {{ dashboard.activeProducts }}
                    </div>

                    <div class="text-green-500 text-sm mt-1">Inventario</div>
                </div>
            </div>
        </div>
    </div>

    <!-- STOCK TOTAL -->

    <div class="col-span-12 lg:col-span-6 xl:col-span-2">
        <div class="card">
            <div class="flex items-center gap-4">
                <!-- Icono -->
                <div class="flex items-center justify-center bg-green-100 dark:bg-blue-400/10 rounded-full flex-shrink-0" style="width: 4rem; height: 4rem">
                    <i class="pi pi-database text-green-500 text-2xl"></i>
                </div>

                <!-- Texto -->
                <div>
                    <div class="text-muted-color font-medium text-sm">Stock Total</div>

                    <div class="text-4xl font-bold mt-2">
                        {{ dashboard.totalStock }}
                    </div>

                    <div class="text-green-500 text-sm mt-1">Inventario</div>
                </div>
            </div>
        </div>
    </div>

    <!-- BAJO STOCK -->

    <div class="col-span-12 lg:col-span-6 xl:col-span-2">
        <div class="card">
            <div class="flex items-center gap-4">
                <!-- Icono -->
                <div class="flex items-center justify-center bg-orange-100 dark:bg-blue-400/10 rounded-full flex-shrink-0" style="width: 4rem; height: 4rem">
                    <i class="pi pi-exclamation-triangle text-orange-500 text-4xl"></i>
                </div>

                <!-- Texto -->
                <div>
                    <div class="text-muted-color font-medium text-sm">Stock Bajo</div>

                    <div class="text-4xl font-bold mt-2">
                        {{ dashboard.lowStock }}
                    </div>

                    <div class="text-orange-500 text-sm mt-1">Atencion</div>
                </div>
            </div>
        </div>
    </div>

    <!-- SIN STOCK -->

    <div class="col-span-12 lg:col-span-6 xl:col-span-2">
        <div class="card">
            <div class="flex items-center gap-4">
                <!-- Icono -->
                <div class="flex items-center justify-center bg-red-100 dark:bg-blue-400/10 rounded-full flex-shrink-0" style="width: 4rem; height: 4rem">
                    <i class="pi pi-times-circle text-red-500 !text-xl" />
                </div>

                <!-- Texto -->
                <div>
                    <div class="text-muted-color font-medium text-sm">Sin Stock</div>

                    <div class="text-4xl font-bold mt-2">
                        {{ dashboard.outOfStock }}
                    </div>

                    <div class="text-red-500 text-sm mt-1">Reponer</div>
                </div>
            </div>
        </div>
    </div>

    <!-- VALOR INVENTARIO -->

    <div class="col-span-12 lg:col-span-6 xl:col-span-2">
        <div class="card">
            <div class="flex items-center gap-4">
                <!-- Icono -->
                <div class="flex items-center justify-center bg-purple-100 dark:bg-blue-400/10 rounded-full flex-shrink-0" style="width: 4rem; height: 4rem">
                    <i class="pi pi-wallet text-purple-500 text-4xl"></i>
                </div>

                <!-- Texto -->
                <div>
                    <div class="text-muted-color font-medium text-sm">Valor Inventario</div>

                    <div class="text-3xl font-bold mt-2">Bs {{ money(dashboard.inventoryValue) }}</div>

                    <div class="text-purple-500 text-sm mt-1">Valor total</div>
                </div>
            </div>
        </div>
    </div>

    <!-- VENTAS MES -->

    <div class="col-span-12 lg:col-span-6 xl:col-span-2">
        <div class="card">
            <div class="flex items-center gap-4">
                <!-- Icono -->
                <div class="flex items-center justify-center bg-cyan-100 dark:bg-blue-400/10 rounded-full flex-shrink-0" style="width: 4rem; height: 4rem">
                    <i class="pi pi-chart-line text-cyan-500 text-4xl"></i>
                </div>

                <!-- Texto -->
                <div>
                    <div class="text-muted-color font-medium text-sm">Ventas del Mes</div>

                    <div class="text-3xl font-bold mt-2">Bs {{ money(dashboard.monthlySales) }}</div>

                    <div class="text-cyan-500 text-sm mt-1">Ingresos del mes</div>
                </div>
            </div>
        </div>
    </div>
</template>
