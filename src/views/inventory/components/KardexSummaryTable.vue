<script setup>
import InventoryService from '@/service/inventory.service';
import { onMounted, ref } from 'vue';

const loading = ref(false);
const movements = ref([]);

async function loadData() {
    loading.value = true;

    try {
        const data = await InventoryService.getRecentMovements(5);

        movements.value = data;
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
}

function getMovementLabel(type) {
    switch (type) {
        case 'PURCHASE':
            return 'Compra';

        case 'SALE':
            return 'Venta';

        case 'INITIAL_STOCK':
            return 'Stock Inicial';

        case 'ADJUSTMENT_IN':
            return 'Ajuste Entrada';

        case 'ADJUSTMENT_OUT':
            return 'Ajuste Salida';

        default:
            return type;
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
            <div class="font-semibold text-xl">📒 Kardex Reciente</div>

            <Button icon="pi pi-refresh" text rounded @click="loadData" />
        </div>

        <DataTable :value="movements" :loading="loading" responsive-layout="scroll" class="p-datatable-sm">
            <Column header="Fecha">
                <template #body="{ data }">
                    {{ formatDate(data.date) }}
                </template>
            </Column>

            <Column header="Movimiento">
                <template #body="{ data }">
                    {{ getMovementLabel(data.type) }}
                </template>
            </Column>

            <Column header="Entrada">
                <template #body="{ data }">
                    <span v-if="data.type === 'PURCHASE' || data.type === 'INITIAL_STOCK' || data.type === 'ADJUSTMENT_IN'" class="text-green-500 font-semibold">+{{ data.quantity }}</span>

                    <span v-else>-</span>
                </template>
            </Column>

            <Column header="Salida">
                <template #body="{ data }">
                    <span v-if="data.type === 'SALE' || data.type === 'ADJUSTMENT_OUT'" class="text-red-500 font-semibold">-{{ data.quantity }}</span>

                    <span v-else>-</span>
                </template>
            </Column>

            <Column header="Producto">
                <template #body="{ data }">
                    {{ data.productName }}
                </template>
            </Column>
        </DataTable>

        <div class="mt-3 text-sm text-500">Mostrando últimos 5 movimientos</div>
    </div>
</template>
