<script setup>
import InventoryService from '@/service/inventory.service';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { onMounted, ref } from 'vue';

const loading = ref(false);
const products = ref([]);

async function loadData() {
    loading.value = true;

    try {
        products.value = await InventoryService.getLowStock();
    } catch (error) {
        console.error('Error cargando productos con bajo stock', error);
    } finally {
        loading.value = false;
    }
}

onMounted(loadData);
</script>

<template>
    <div class="card h-full">
        <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-xl">Bajo Stock</div>

            <Button icon="pi pi-refresh" text rounded @click="loadData" />
        </div>

        <DataTable :value="products" :loading="loading" :rows="5" responsive-layout="scroll">
            <Column field="name" header="Producto" />

            <Column field="stock" header="Stock Actual">
                <template #body="slotProps">
                    <span class="text-red-500 font-semibold">
                        {{ slotProps.data.stock }}
                    </span>
                </template>
            </Column>

            <Column field="minStock" header="Stock Mínimo" />
        </DataTable>

        <div class="mt-3 text-sm text-500">
            Mostrando
            {{ products.length }}
            productos con stock bajo
        </div>
    </div>
</template>
