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

        const data =
            await DashboardService
                .getRegistrationsComparison();

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
                data.labels,

            datasets: [

                {
                    label:
                        'Mes Actual',

                    backgroundColor:

                        documentStyle
                            .getPropertyValue(
                                '--p-primary-500'
                            ),

                    data:
                        data.currentMonth
                },

                {
                    label:
                        'Mes Anterior',

                    backgroundColor:

                        documentStyle
                            .getPropertyValue(
                                '--p-primary-200'
                            ),

                    data:
                        data.previousMonth
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

                        display: false
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

    loadChart,

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

            Inscripciones

            Mes actual
            vs anterior

        </div>

        <Chart type="bar" :data="chartData
            " :options="chartOptions
    " />

    </div>

</template>
