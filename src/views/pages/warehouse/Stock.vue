<script setup>
import { computed, onMounted, ref } from 'vue';

import StockService from '@/service/stock.service';

import { useAuthStore } from '@/store/auth.store';

const auth = useAuthStore();

const loading = ref(false);

const stock = ref([]);

const canView = computed(() => auth.can('TENANT_INVENTORY_VIEW'));

async function loadStock() {
    loading.value = true;

    try {
        stock.value = await StockService.getAll();
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await loadStock();
});
</script>

<template>
    <div>
        <div class="flex justify-content-between mb-3">
            <h3>Stock Actual</h3>
        </div>

        <Toolbar class="mb-6">
            <template #start>
                <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" @click="loadStock" />
            </template>
        </Toolbar>
        <div class="card mt-4">
            <DataTable v-if="canView" :value="stock" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" striped-rows responsive-layout="scroll">
                <Column field="code" header="Código" />

                <Column field="name" header="Producto" />

                <Column field="stock" header="Stock">
                    <template #body="{ data }">
                        <Tag :value="data.stock" severity="info" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
