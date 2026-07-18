<script setup>
import { onMounted, ref } from 'vue';

import ProductService from '@/modules/products/services/product.service';
import InventoryKardexService from '@/service/kardex.service';

const loading = ref(false);

const products = ref([]);
const kardex = ref([]);

const selectedProductId = ref(null);

async function loadProducts() {
    products.value = await ProductService.getAll({
        isActive: true
    });
}

async function searchKardex() {
    if (!selectedProductId.value) {
        return;
    }

    loading.value = true;

    try {
        kardex.value = await InventoryKardexService.getByProduct(selectedProductId.value);
    } finally {
        loading.value = false;
    }
}
function getMovementLabel(type) {
    const map = {
        INITIAL_STOCK: 'Stock Inicial',
        PURCHASE: 'Compra',
        SALE: 'Venta',
        ADJUSTMENT_IN: 'Ajuste Entrada',
        ADJUSTMENT_OUT: 'Ajuste Salida',
        TRANSFER_IN: 'Transferencia Entrada',
        TRANSFER_OUT: 'Transferencia Salida'
    };

    return map[type] || type;
}
function getMovementSeverity(type) {
    if (type === 'INITIAL_STOCK' || type === 'PURCHASE' || type === 'ADJUSTMENT_IN' || type === 'TRANSFER_IN') {
        return 'success';
    }

    return 'danger';
}

onMounted(async () => {
    await loadProducts();
});
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Dropdown v-model="selectedProductId" :options="products" option-label="name" option-value="id" placeholder="Seleccionar producto" filter class="mr-2" style="min-width: 300px" />

                <Button label="Consultar" icon="pi pi-search" severity="secondary" @click="searchKardex" />
            </template>
        </Toolbar>

        <div class="flex justify-content-between mb-3">
            <h3>Kardex</h3>
        </div>

        <DataTable :value="kardex" :loading="loading">
            <Column header="Fecha">
                <template #body="{ data }">
                    {{ new Date(data.date).toLocaleString() }}
                </template>
            </Column>

            <Column header="Tipo">
                <template #body="{ data }">
                    <Tag :value="getMovementLabel(data.movementType)" :severity="getMovementSeverity(data.movementType)" />
                </template>
            </Column>

            <Column field="input" header="Entrada" />

            <Column field="output" header="Salida" />

            <Column field="balance" header="Saldo" />

            <Column header="Usuario">
                <template #body="{ data }">
                    {{ data.createdBy?.fullName }}
                </template>
            </Column>

            <Column field="notes" header="Observaciones" />
        </DataTable>
    </div>
</template>
