<script setup>
import BranchService from '@/service/branch.service';
import PartnerService from '@/service/partner.service';
import PurchaseService from '@/service/productPurchase.service';
import UserService from '@/service/user.service';
import { formatDateShort } from '@/utils/date';
import { onMounted, ref, watch } from 'vue';
import { useAuthStore } from '../../store/auth.store';
// ==========================
// STORE
// ==========================

const authStore = useAuthStore();

// ==========================
// STATE
// ==========================

const loading = ref(false);

const purchases = ref([]);

const branches = ref([]);

const users = ref([]);
const selectedPartner = ref(null);
const filters = ref({
    search: '',

    supplierId: null,
    branchId: null,
    status: null,
    userId: null,
    from: null,
    to: null
});

const partners = ref([]);

const filteredPartners = ref([]);

const statusOptions = [
    {
        label: 'Confirmadas',
        value: 'CONFIRMED'
    },
    {
        label: 'Borradores',
        value: 'DRAFT'
    },
    {
        label: 'Anuladas',
        value: 'CANCELLED'
    }
];
// ==========================
// LOAD PURCHASES
// ==========================
function viewPDF() {
    console.log('PDF');
}

function viewPurchase(data) {
    console.log(data);
}
async function loadPurchases() {
    loading.value = true;
    console.log('loadPurchases', filters);
    try {
        const data = await PurchaseService.getAll({
            search: filters.value.search,
            supplierId: filters.value.supplierId,
            branchId: filters.value.branchId,
            status: filters.value.status,
            userId: filters.value.userId,
            from: filters.value.from,
            to: filters.value.to
        });

        partners.value = await PartnerService.getAll({
            type: 'SUPPLIER'
        });

        purchases.value = data.map((purchase) => ({
            ...purchase,
            itemsCount: purchase.details?.length || 0
        }));
    } catch (error) {
        console.error('Error cargando compras:', error);
    } finally {
        loading.value = false;
    }
}

// ==========================
// LOAD BRANCHES
// ==========================

async function loadBranches() {
    if (!authStore.user?.isOwner) {
        return;
    }

    try {
        branches.value = await BranchService.getAll();
    } catch (error) {
        console.error(error);
    }
}
async function loadUsers() {
    try {
        users.value = await UserService.getAll();
    } catch (error) {
        console.error(error);
    }
}
// ==========================
// FILTERS
// ==========================

async function clearFilters() {
    const today = new Date();

    const from = new Date();

    from.setDate(today.getDate() - 30);

    selectedPartner.value = null;

    filters.value = {
        search: '',
        supplierId: null,
        branchId: null,
        status: null,
        from,
        to: today
    };

    await loadPurchases();
}
// ==========================
// HELPERS
// ==========================

function getStatusSeverity(status) {
    switch (status) {
        case 'CONFIRMED':
            return 'success';

        case 'DRAFT':
            return 'warning';

        case 'CANCELLED':
            return 'danger';

        default:
            return 'secondary';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'CONFIRMED':
            return 'CONFIRMADA';

        case 'DRAFT':
            return 'BORRADOR';

        case 'CANCELLED':
            return 'ANULADA';

        default:
            return status;
    }
}
// ==========================
// ACTIONS
// ==========================
function searchPartners(event) {
    const query = event.query.toLowerCase();

    filteredPartners.value = partners.value.filter((partner) => partner.name.toLowerCase().includes(query));
}

watch(selectedPartner, (value) => {
    filters.value.supplierId = value?.id || null;
});
// ==========================
// INIT
// ==========================

onMounted(async () => {
    const today = new Date();

    filters.value.from = new Date(today.getFullYear(), today.getMonth(), 1);

    filters.value.to = today;

    await loadBranches();
    await loadUsers();
    await loadPurchases();
});
</script>

<template>
    <div>
        <!-- TÍTULO -->

        <!-- TITLE -->

        <div class="flex justify-content-between mb-3">
            <h3>Historial de Compras</h3>
        </div>

        <!-- FILTROS -->

        <div class="flex flex-wrap gap-2 mb-3">
            <!-- Buscar -->

            <AutoComplete v-model="selectedPartner" :suggestions="filteredPartners" option-label="name" placeholder="Proveedor" dropdown @complete="searchPartners" />
            <!-- Sucursal -->

            <Dropdown v-if="authStore.user?.isOwner" v-model="filters.branchId" :options="branches" option-label="name" option-value="id" placeholder="Sucursal" show-clear />

            <!-- Desde -->

            <Calendar v-model="filters.from" placeholder="Desde" date-format="dd/mm/yy" show-icon />

            <!-- Hasta -->

            <Calendar v-model="filters.to" placeholder="Hasta" date-format="dd/mm/yy" show-icon />

            <!-- Estado -->

            <Dropdown v-model="filters.status" :options="statusOptions" option-label="label" option-value="value" placeholder="Estado" show-clear />

            <!-- Usuario -->
            <Dropdown v-model="filters.userId" :options="users" option-label="fullName" option-value="id" placeholder="Usuario" show-clear />
            <!-- Filtrar -->

            <Button label="Filtrar" icon="pi pi-search" @click="loadPurchases" />

            <!-- PDF -->

            <Button label="Excel" icon="pi pi-file-excel" severity="success" />

            <Button label="PDF" icon="pi pi-file-pdf" severity="danger" @click="viewPDF" />

            <Button label="Reset" icon="pi pi-refresh" severity="secondary" @click="clearFilters" />
        </div>

        <!-- TABLA -->

        <div class="card mt-4">
            <DataTable :value="purchases" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" striped-rows responsive-layout="scroll">
                <template #empty>No se encontraron compras.</template>

                <Column header="Fecha">
                    <template #body="{ data }">
                        {{ formatDateShort(data.purchaseDate) }}
                    </template>
                </Column>

                <Column header="Nro Compra">
                    <template #body="{ data }">#{{ data.purchaseNumber }}</template>
                </Column>

                <Column header="Proveedor">
                    <template #body="{ data }">
                        {{ data.supplier?.name }}
                    </template>
                </Column>

                <Column header="Sucursal">
                    <template #body="{ data }">
                        {{ data.branch?.name }}
                    </template>
                </Column>
                <Column header="Usuario">
                    <template #body="{ data }">
                        {{ data.user?.fullName }}
                    </template>
                </Column>

                <Column header="Total">
                    <template #body="{ data }">
                        <span class="font-semibold">Bs {{ Number(data.total).toFixed(2) }}</span>
                    </template>
                </Column>

                <Column header="Estado">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                    </template>
                </Column>

                <Column header="Acciones" style="width: 120px">
                    <template #body="{ data }">
                        <Button icon="pi pi-eye" severity="info" text rounded @click="viewPurchase(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
