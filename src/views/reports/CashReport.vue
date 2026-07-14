<script setup>
import BranchService from '@/service/branch.service';
import CashRegisterService from '@/service/cashRegister.service';

import { useAuthStore } from '@/store/auth.store';

import { formatDate } from '@/utils/date';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const auth = useAuthStore();

const loading = ref(false);

const cashRegisters = ref([]);
const branches = ref([]);

const today = new Date();

const from = new Date();
from.setDate(today.getDate() - 30);

const filters = ref({
    branchId: null,
    status: null,
    from,
    to: today
});

const statusOptions = [
    {
        label: 'Abiertas',
        value: 'OPEN'
    },
    {
        label: 'Cerradas',
        value: 'CLOSED'
    }
];

async function loadCatalogs() {
    branches.value = await BranchService.getAll();
}

async function loadData() {
    loading.value = true;

    try {
        cashRegisters.value = await CashRegisterService.getAll({
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
function viewDetail(cashRegister) {
    router.push(`/reports/cash/${cashRegister.id}`);
}
function resetFilters() {
    const today = new Date();

    const from = new Date();
    from.setDate(today.getDate() - 30);

    filters.value = {
        branchId: null,
        status: null,
        from,
        to: today
    };

    loadData();
}

// function viewCash(row) {
//     router.push(`/reportes/caja/${row.id}`);
// }

function getStatusSeverity(status) {
    switch (status) {
        case 'OPEN':
            return 'warning';

        case 'CLOSED':
            return 'success';

        default:
            return 'secondary';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'OPEN':
            return 'ABIERTA';

        case 'CLOSED':
            return 'CERRADA';

        default:
            return status;
    }
}

onMounted(async () => {
    await loadCatalogs();
    await loadData();
});
</script>

<template>
    <div>
        <div class="flex justify-content-between mb-3">
            <h3>Reporte de Cajas</h3>
        </div>

        <!-- FILTROS -->

        <div class="flex flex-wrap gap-2 mb-3">
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
            <DataTable :value="cashRegisters" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" striped-rows responsive-layout="scroll">
                <template #empty>No se encontraron compras.</template>
                <Column header="Apertura">
                    <template #body="{ data }">
                        {{ formatDate(data.openedAt) }}
                    </template>
                </Column>

                <Column header="Cierre">
                    <template #body="{ data }">
                        {{ data.closedAt ? formatDate(data.closedAt) : '-' }}
                    </template>
                </Column>

                <Column v-if="auth.user?.isOwner" header="Sucursal">
                    <template #body="{ data }">
                        {{ data.branch?.name }}
                    </template>
                </Column>

                <Column header="Abierta Por">
                    <template #body="{ data }">
                        {{ data.openedBy?.fullName }}
                    </template>
                </Column>

                <Column header="Cerrada Por">
                    <template #body="{ data }">
                        {{ data.closedBy?.fullName || '-' }}
                    </template>
                </Column>

                <Column header="Monto Apertura">
                    <template #body="{ data }">Bs {{ Number(data.openingAmount || 0).toFixed(2) }}</template>
                </Column>

                <Column header="Esperado">
                    <template #body="{ data }">Bs {{ Number(data.expectedAmount || 0).toFixed(2) }}</template>
                </Column>

                <Column header="Contado">
                    <template #body="{ data }">Bs {{ Number(data.countedAmount || 0).toFixed(2) }}</template>
                </Column>

                <Column header="Dif.">
                    <template #body="{ data }">Bs {{ Number(data.difference || 0).toFixed(2) }}</template>
                </Column>

                <Column header="Estado">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                    </template>
                </Column>

                <Column header="Acciones">
                    <template #body="{ data }">
                        <Button icon="pi pi-eye" severity="info" rounded text @click="viewDetail(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
