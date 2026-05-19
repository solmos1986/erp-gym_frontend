<script setup>
import Chart from 'primevue/chart';

import DashboardService from '@/service/dashboard.service';

import { useLayout } from '@/layout/composables/layout';

import {
    onMounted,
    ref,
    watch
} from 'vue';

const {
    getPrimary,
    getSurface,
    isDarkTheme
} = useLayout();

const chartData = ref();

const chartOptions = ref();

const loadChart =
    async () => {

        const revenue =
            await DashboardService
                .getRevenueComparison();

        const documentStyle =
            getComputedStyle(
                document.documentElement
            );

        const textColor =
            documentStyle
                .getPropertyValue(
                    '--text-color'
                );

        const textColorSecondary =
            documentStyle
                .getPropertyValue(
                    '--text-color-secondary'
                );

        const surfaceBorder =
            documentStyle
                .getPropertyValue(
                    '--surface-border'
                );

        chartData.value = {

            labels:
                revenue.labels,

            datasets: [

                {
                    label:
                        'Mes Actual',

                    data:
                        revenue.currentMonth,

                    fill: false,

                    backgroundColor:

                        documentStyle
                            .getPropertyValue(
                                '--p-primary-500'
                            ),

                    borderColor:

                        documentStyle
                            .getPropertyValue(
                                '--p-primary-500'
                            ),

                    tension: 0.4
                },

                {
                    label:
                        'Mes Anterior',

                    data:
                        revenue.previousMonth,

                    fill: false,

                    backgroundColor:

                        documentStyle
                            .getPropertyValue(
                                '--p-primary-200'
                            ),

                    borderColor:

                        documentStyle
                            .getPropertyValue(
                                '--p-primary-200'
                            ),

                    tension: 0.4
                }
            ]
        };

        chartOptions.value = {

            plugins: {

                legend: {

                    labels: {

                        color:
                            textColor
                    }
                }
            },

            scales: {

                x: {

                    ticks: {

                        color:
                            textColorSecondary
                    },

                    grid: {

                        color:
                            surfaceBorder
                    }
                },

                y: {

                    ticks: {

                        color:
                            textColorSecondary
                    },

                    grid: {

                        color:
                            surfaceBorder
                    }
                }
            }
        };
    };

watch(
    [
        getPrimary,
        getSurface,
        isDarkTheme
    ],

    () => {

        loadChart();

    },

    {
        immediate: true
    }
);

onMounted(
    loadChart
);

</script>

<template>

    <div class="card">

        <div class="
font-semibold
text-xl
mb-4
">

            Ingresos

            Mes actual
            vs anterior

        </div>

        <Chart type="line" :data="chartData
            " :options="chartOptions
    " />

    </div>

</template>
