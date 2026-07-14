<script setup>
import GymStatsWidget from '../../../components/dashboard/GymStatsWidget.vue';

import RevenueChartWidget from '../../../components/dashboard/RevenueChartWidget.vue';

import RegistrationsChartWidget from '../../../components/dashboard/RegistrationsChartWidget.vue';

import PlanDistributionWidget from '../../../components/dashboard/PlanDistributionWidget.vue';
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- KPIs -->

        <GymStatsWidget />

        <!-- 💰 REVENUE -->

        <div class="col-span-12 xl:col-span-6">
            <RevenueChartWidget />
        </div>

        <!-- 📅 REGISTRATIONS -->

        <div class="col-span-12 xl:col-span-6">
            <RegistrationsChartWidget />
        </div>

        <!-- 🍩 PLANES -->

        <div class="col-span-12 xl:col-span-6">
            <PlanDistributionWidget />
        </div>
    </div>
</template>
