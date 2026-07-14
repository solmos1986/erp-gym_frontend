<script setup>
import InventoryService from '@/service/inventory.service';
import { computed, onMounted, ref } from 'vue';

const loading = ref(false);
const products = ref([]);

async function loadData() {
    loading.value = true;

    try {
        const data = await InventoryService.getTopProducts();

        products.value = data.products || data;
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
}

const totalRevenue = computed(() => {
    return products.value.reduce((sum, p) => sum + Number(p.revenue || 0), 0);
});

function getPercent(revenue) {
    if (!totalRevenue.value) {
        return 0;
    }

    return Math.round((Number(revenue || 0) * 100) / totalRevenue.value);
}

function money(value) {
    return Number(value || 0).toLocaleString('es-BO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function getBarColor(index) {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-cyan-500'];

    return colors[index % colors.length];
}

onMounted(loadData);
</script>

<template>
    <div class="card h-full">
        <div class="flex justify-between items-center mb-5">
            <div class="font-semibold text-xl">Productos Más Vendidos</div>

            <Button icon="pi pi-refresh" text rounded @click="loadData" />
        </div>

        <div v-if="loading" class="text-center py-4">Cargando...</div>

        <div v-else class="flex flex-col gap-4 w-full">
            <div v-for="(product, index) in products" :key="product.productId" class="w-full">
                <div class="flex justify-between items-center mb-2 mr-10">
                    <span class="font-medium">
                        {{ product.name }}
                    </span>

                    <span class="font-medium text-surface-700">Bs {{ money(product.revenue) }}</span>
                </div>

                <div class="flex items-center gap-3 w-full">
                    <div class="flex-1 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden" style="height: 8px">
                        <div
                            :class="getBarColor(index)"
                            :style="{
                                width: getPercent(product.revenue) + '%',
                                height: '100%'
                            }"
                        />
                    </div>

                    <span class="text-sm font-medium text-500">{{ getPercent(product.revenue) }}%</span>
                </div>
            </div>
        </div>
    </div>
</template>
