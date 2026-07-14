<script setup>
import DashboardCards from './components/DashboardCards.vue';
import InventoryDistributionChart from './components/InventoryDistributionChart.vue';
import KardexSummaryTable from './components/KardexSummaryTable.vue';
import LowStockTable from './components/LowStockTable.vue';
import ProfitChart from './components/ProfitChart.vue';
import RecentMovementsTable from './components/RecentMovementsTable.vue';
import TopProductsWidget from './components/TopProductsWidget.vue';
</script>

<template>
    <div class="grid grid-cols-12 gap-8 items-stretch">
        <!-- KPI -->
        <DashboardCards />

        <!-- FILA 1 -->

        <div class="col-span-12 xl:col-span-4">
            <LowStockTable />
        </div>

        <div class="col-span-12 xl:col-span-4">
            <RecentMovementsTable />
        </div>
        <div class="col-span-12 xl:col-span-4">
            <TopProductsWidget />
        </div>
        <!--FILA 2-->

        <div class="col-span-12 xl:col-span-4">
            <ProfitChart />
        </div>
        <div class="col-span-12 xl:col-span-4">
            <InventoryDistributionChart />
        </div>
        <div class="col-span-12 xl:col-span-4">
            <KardexSummaryTable />
        </div>
    </div>
</template>
