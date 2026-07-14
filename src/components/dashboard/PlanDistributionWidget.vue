<script setup>
import Chart from 'primevue/chart';

import DashboardService from '@/service/dashboard.service';

import { useLayout } from '@/layout/composables/layout';

import { onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const chartData = ref();

const chartOptions = ref();

const loadChart = async () => {
    const data = await DashboardService.getPlanDistribution();

    const documentStyle = getComputedStyle(document.documentElement);

    const textColor = documentStyle.getPropertyValue('--text-color');

    chartData.value = {
        labels: data.map((x) => x.name),

        datasets: [
            {
                data: data.map((x) => x.value),

                backgroundColor: [
                    documentStyle.getPropertyValue('--p-indigo-500'),

                    documentStyle.getPropertyValue('--p-purple-500'),

                    documentStyle.getPropertyValue('--p-teal-500'),

                    documentStyle.getPropertyValue('--p-orange-500'),

                    documentStyle.getPropertyValue('--p-pink-500')
                ],

                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--p-indigo-400'),

                    documentStyle.getPropertyValue('--p-purple-400'),

                    documentStyle.getPropertyValue('--p-teal-400'),

                    documentStyle.getPropertyValue('--p-orange-400'),

                    documentStyle.getPropertyValue('--p-pink-400')
                ]
            }
        ]
    };

    chartOptions.value = {
        plugins: {
            legend: {
                position: 'top',

                labels: {
                    usePointStyle: true,

                    color: textColor
                }
            }
        }
    };
};

watch(
    [getPrimary, getSurface, isDarkTheme],

    loadChart,

    {
        immediate: true
    }
);

onMounted(loadChart);
</script>

<template>
    <div class="card flex flex-col items-center">
        <div class="font-semibold text-xl mb-4">Distribución por planes</div>

        <Chart type="doughnut" :data="chartData" :options="chartOptions" />
    </div>
</template>
