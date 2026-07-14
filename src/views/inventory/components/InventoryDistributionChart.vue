<script setup>
import { useLayout } from '@/layout/composables/layout';
import InventoryService from '@/service/inventory.service';
import { onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

async function loadData() {
    try {
        const response = await InventoryService.getValuation();

        createChart(response);
    } catch (error) {
        console.error(error);
    }
}

function createChart(response) {
    const documentStyle = getComputedStyle(document.documentElement);

    const textColor = documentStyle.getPropertyValue('--text-color');

    const products = response.products || [];

    chartData.value = {
        labels: products.map((p) => p.name),

        datasets: [
            {
                data: products.map((p) => p.inventoryValue),

                backgroundColor: [
                    documentStyle.getPropertyValue('--p-blue-500'),
                    documentStyle.getPropertyValue('--p-purple-500'),
                    documentStyle.getPropertyValue('--p-green-500'),
                    documentStyle.getPropertyValue('--p-orange-500'),
                    documentStyle.getPropertyValue('--p-cyan-500')
                ],

                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--p-blue-400'),
                    documentStyle.getPropertyValue('--p-purple-400'),
                    documentStyle.getPropertyValue('--p-green-400'),
                    documentStyle.getPropertyValue('--p-orange-400'),
                    documentStyle.getPropertyValue('--p-cyan-400')
                ]
            }
        ]
    };

    chartOptions.value = {
        cutout: '65%',

        plugins: {
            legend: {
                position: 'right',

                labels: {
                    usePointStyle: true,
                    color: textColor
                }
            }
        }
    };
}

onMounted(loadData);

watch([getPrimary, getSurface, isDarkTheme], () => {
    loadData();
});
</script>

<template>
    <div class="card" style="height: 400px">
        <div class="font-semibold text-xl mb-4">Distribución del Inventario</div>

        <div class="flex justify-center">
            <Chart type="doughnut" :data="chartData" :options="chartOptions" style="width: 90%; height: 90%" />
        </div>
    </div>
</template>
