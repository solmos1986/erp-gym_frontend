<script setup>
import { useLayout } from '@/layout/composables/layout';
import InventoryService from '@/service/inventory.service';
import { onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

async function loadData() {
    try {
        const response = await InventoryService.getGeneralProfitability();

        createChart(response);
    } catch (error) {
        console.error(error);
    }
}

function createChart(data) {
    const documentStyle = getComputedStyle(document.documentElement);

    const textColor = documentStyle.getPropertyValue('--text-color');

    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');

    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    chartData.value = {
        labels: ['Ventas', 'Costos', 'Utilidad'],

        datasets: [
            {
                label: 'Bs',

                backgroundColor: [documentStyle.getPropertyValue('--p-blue-300'), documentStyle.getPropertyValue('--p-red-300'), documentStyle.getPropertyValue('--p-green-300')],

                borderColor: [documentStyle.getPropertyValue('--p-blue-500'), documentStyle.getPropertyValue('--p-red-500'), documentStyle.getPropertyValue('--p-green-500')],

                data: [data.revenue, data.cost, data.profit]
            }
        ]
    };

    chartOptions.value = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },

        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },

            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
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
    <div class="card h-full" style="height: 400px">
        <div class="font-semibold text-xl mb-4">Ventas vs Costos vs Utilidad</div>

        <Chart type="bar" :data="chartData" :options="chartOptions" style="height: 90%" />
    </div>
</template>
