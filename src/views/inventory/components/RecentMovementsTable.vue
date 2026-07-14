<script setup>
import InventoryService from '@/service/inventory.service';
import { onMounted, ref } from 'vue';

const loading = ref(false);
const movements = ref([]);

async function loadData() {
    loading.value = true;

    try {
        const data = await InventoryService.getRecentMovements();

        console.log('MOVEMENTS', data);

        movements.value = data;
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
}
function getConfig(type) {
    switch (type) {
        case 'PURCHASE':
            return {
                label: 'Compra',
                icon: 'pi pi-arrow-down',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-500',
                valueColor: 'text-green-500',
                sign: '+'
            };

        case 'INITIAL_STOCK':
            return {
                label: 'Stock Inicial',
                icon: 'pi pi-box',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-500',
                valueColor: 'text-blue-500',
                sign: '+'
            };

        case 'SALE':
            return {
                label: 'Venta',
                icon: 'pi pi-arrow-up',
                iconBg: 'bg-red-100',
                iconColor: 'text-red-500',
                valueColor: 'text-red-500',
                sign: '-'
            };

        case 'ADJUSTMENT_IN':
            return {
                label: 'Ajuste Entrada',
                icon: 'pi pi-plus',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-500',
                valueColor: 'text-green-500',
                sign: '+'
            };

        case 'ADJUSTMENT_OUT':
            return {
                label: 'Ajuste Salida',
                icon: 'pi pi-minus',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-500',
                valueColor: 'text-orange-500',
                sign: '-'
            };

        default:
            return {
                label: type,
                icon: 'pi pi-info-circle',
                iconBg: 'bg-surface-100',
                iconColor: 'text-surface-500',
                valueColor: 'text-surface-500',
                sign: ''
            };
    }
}

function formatDate(date) {
    return new Date(date).toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

onMounted(loadData);
</script>

<template>
    <div class="card h-full">
        <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-xl">Movimientos Recientes</div>

            <Button icon="pi pi-refresh" text rounded @click="loadData" />
        </div>

        <div v-if="loading" class="text-center py-4">Cargando...</div>

        <div v-else>
            <div
                v-for="(movement, index) in movements"
                :key="movement.id"
                class="flex justify-between items-center py-4"
                :class="{
                    'border-b border-surface-200 dark:border-surface-700': index < movements.length - 1
                }"
            >
                <!-- IZQUIERDA -->

                <div class="flex items-center gap-4">
                    <div :class="[getConfig(movement.type).iconBg, 'flex items-center justify-center rounded-full']" style="width: 3rem; height: 3rem; min-width: 3rem">
                        <i :class="[getConfig(movement.type).icon, getConfig(movement.type).iconColor, 'text-xl']" />
                    </div>

                    <div>
                        <div class="font-medium" :class="getConfig(movement.type).iconColor">
                            {{ getConfig(movement.type).label }}
                        </div>

                        <div class="text-600 text-sm">
                            {{ movement.productName }}
                        </div>
                    </div>
                </div>

                <!-- DERECHA -->

                <div class="text-right">
                    <div class="font-semibold" :class="getConfig(movement.type).valueColor">{{ getConfig(movement.type).sign }}{{ movement.quantity }}</div>

                    <div class="text-500 text-sm">
                        {{ formatDate(movement.date) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
