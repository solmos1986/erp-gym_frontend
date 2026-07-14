<script setup>
import BranchService from '@/service/branch.service';
import PartnerService from '@/service/partner.service';
import ReportService from '@/service/report.service';
import UserService from '@/service/user.service';

import { useAuthStore } from '@/store/auth.store';

import { formatDate } from '@/utils/date';

import { onMounted, ref, watch } from 'vue';

const auth = useAuthStore();

const loading = ref(false);

const sales = ref([]);

const partners = ref([]);
const branches = ref([]);
const users = ref([]);

const selectedPartner = ref(null);
const filteredPartners = ref([]);

const today = new Date();

const from = new Date();

from.setDate(today.getDate() - 30);

const filters = ref({
    customerId: null,
    userId: null,
    branchId: null,
    status: null,
    from,
    to: today
});

const statusOptions = [
    {
        label: 'Confirmadas',
        value: 'CONFIRMED'
    },
    {
        label: 'Anuladas',
        value: 'CANCELLED'
    }
];

const getStatusSeverity = (status) => {
    switch (status) {
        case 'CONFIRMED':
            return 'success';

        case 'CANCELLED':
            return 'danger';

        default:
            return 'warning';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'CONFIRMED':
            return 'CONFIRMADA';

        case 'CANCELLED':
            return 'ANULADA';

        default:
            return status;
    }
};

async function loadCatalogs() {
    partners.value = await PartnerService.getAll({
        type: 'CUSTOMER'
    });

    branches.value = await BranchService.getAll();

    users.value = await UserService.getAll();
}

async function loadData() {
    console.log('filters ', filters);
    loading.value = true;

    try {
        sales.value = await ReportService.getSales({
            customerId: filters.value.customerId,
            userId: filters.value.userId,
            branchId: filters.value.branchId,
            status: filters.value.status,
            from: filters.value.from,
            to: filters.value.to
        });
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
}

function searchPartners(event) {
    const query = event.query.toLowerCase();

    filteredPartners.value = partners.value.filter((partner) => partner.name.toLowerCase().includes(query));
}

function resetFilters() {
    const today = new Date();

    const from = new Date();

    from.setDate(today.getDate() - 30);

    selectedPartner.value = null;

    filters.value = {
        customerId: null,
        userId: null,
        branchId: null,
        status: null,
        from,
        to: today
    };

    loadData();
}

watch(selectedPartner, (value) => {
    filters.value.customerId = value?.id || null;
});

onMounted(async () => {
    await loadCatalogs();

    await loadData();
});
</script>

<template>
    <div>
        <!-- TITULO -->

        <div class="flex justify-content-between mb-3">
            <h3>Reporte de Ventas</h3>
        </div>

        <!-- FILTROS -->

        <div class="flex flex-wrap gap-2 mb-3">
            <AutoComplete v-model="selectedPartner" :suggestions="filteredPartners" option-label="name" placeholder="Cliente" dropdown @complete="searchPartners" />

            <Dropdown v-model="filters.userId" :options="users" option-label="fullName" option-value="id" placeholder="Vendedor" show-clear />

            <Dropdown v-if="auth.user?.isOwner" v-model="filters.branchId" :options="branches" option-label="name" option-value="id" placeholder="Sucursal" show-clear />

            <Dropdown v-model="filters.status" :options="statusOptions" option-label="label" option-value="value" placeholder="Estado" show-clear />

            <Calendar v-model="filters.from" placeholder="Desde" date-format="dd/mm/yy" show-icon />

            <Calendar v-model="filters.to" placeholder="Hasta" date-format="dd/mm/yy" show-icon />

            <Button label="Filtrar" icon="pi pi-search" @click="loadData" />

            <Button label="Excel" icon="pi pi-file-excel" severity="success" />

            <Button label="PDF" icon="pi pi-file-pdf" severity="danger" />
            <Button label="Reset" icon="pi pi-refresh" severity="secondary" @click="resetFilters" />
        </div>

        <!-- TABLA -->
        <div class="card mt-4">
            <DataTable :value="sales" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" striped-rows responsive-layout="scroll">
                <Column header="Fecha">
                    <template #body="{ data }">
                        {{ formatDate(data.date) }}
                    </template>
                </Column>
                <Column header="Cliente">
                    <template #body="{ data }">
                        {{ data.customer }}
                    </template>
                </Column>

                <Column header="Vendedor">
                    <template #body="{ data }">
                        {{ data.seller }}
                    </template>
                </Column>

                <Column header="Total">
                    <template #body="{ data }">Bs {{ data.total }}</template>
                </Column>

                <Column header="Estado">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
