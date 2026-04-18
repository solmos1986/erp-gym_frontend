<script setup>
import { useAuthStore } from '@/store/auth.store';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import api from '@/service/api';
import CashMovementService from '@/service/cashmovement.service';
import cashRegisterService from '@/service/cashregister.service';

const toast = useToast();
const auth = useAuthStore();

// ======================
// ESTADOS
// ======================
const movements = ref([]);
const loading = ref(false);
const showFilters = ref(false);

// ======================
// PERMISOS
// ======================
const canViewAll = computed(() => auth.can('ERP_TREASURY_VIEW'));

// ======================
// FILTROS
// ======================
const filters = ref({
    cashRegisterId: null,
    userId: null,
    fromDate: null,
    toDate: null,
    type: null,
    origin: null
});

// ======================
// AUTOCOMPLETE
// ======================
const cashRegisterSuggestions = ref([]);
const searchingCashRegister = ref(false);

const userSuggestions = ref([]);
const searchingUser = ref(false);

const selectedCashRegister = ref(null);
const selectedUser = ref(null);

// ======================
// CARGAR MOVIMIENTOS
// ======================
async function loadMovements(params = {}) {
    loading.value = true;
    try {
        movements.value = await CashMovementService.getAll(params);
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los movimientos de caja',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadMovements();
});

// ======================
// FILTROS
// ======================
function openFilters() {
    showFilters.value = true;
}

function resetFilters() {
    filters.value = {
        cashRegisterId: null,
        userId: null,
        fromDate: null,
        toDate: null,
        type: null,
        origin: null
    };

    selectedCashRegister.value = null;
    selectedUser.value = null;

    showFilters.value = false;
    loadMovements();
}

async function applyFilters() {
    try {
        loading.value = true;

        movements.value = await CashMovementService.getAll({
            cashRegisterId: selectedCashRegister.value?.id || null,
            userId: selectedUser.value?.id || null,
            fromDate: filters.value.fromDate,
            toDate: filters.value.toDate,
            type: filters.value.type,
            origin: filters.value.origin
        });

        showFilters.value = false;
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron aplicar los filtros',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

// ======================
// SEARCH CAJAS
// ======================
async function searchCashRegister(event) {
    if (!event.query || event.query.length < 1) {
        cashRegisterSuggestions.value = [];
        return;
    }

    searchingCashRegister.value = true;
    try {
        const res = await cashRegisterService.search(event.query);
        cashRegisterSuggestions.value = res;
    } finally {
        searchingCashRegister.value = false;
    }
}

// ======================
// SEARCH USUARIOS
// ======================
async function searchUser(event) {
    if (!event.query || event.query.length < 2) {
        userSuggestions.value = [];
        return;
    }

    searchingUser.value = true;
    try {
        const res = await api.get('/userErp/search', {
            params: { q: event.query }
        });
        userSuggestions.value = res.data;
    } finally {
        searchingUser.value = false;
    }
}

// ======================
// HELPERS UI
// ======================
function typeSeverity(type) {
    return type === 'IN' ? 'success' : 'danger';
}

function formatDate(date) {
    return new Date(date).toLocaleString();
}
</script>

<template>
    <div class="card">
        <!-- TOOLBAR -->
        <Toolbar class="mb-4">
            <template #end>
                <div class="flex gap-2">
                    <Button icon="pi pi-refresh" severity="secondary" @click="loadMovements" />
                    <Button label="Filtros" icon="pi pi-filter" severity="success" @click="openFilters" />
                </div>
            </template>
        </Toolbar>
        <div class="flex justify-content-between mb-3">
            <h3>Movimientos de cajas</h3>
        </div>
        <!-- TABLA -->
        <DataTable :value="movements" :loading="loading" paginator :rows="15" responsiveLayout="scroll">
            <Column header="Fecha">
                <template #body="{ data }">
                    {{ formatDate(data.createdAt) }}
                </template>
            </Column>

            <Column header="Caja">
                <template #body="{ data }">
                    {{ data.cashRegister?.name || '-' }}
                </template>
            </Column>

            <Column header="Usuario">
                <template #body="{ data }">
                    {{ data.user?.name || '-' }}
                </template>
            </Column>

            <Column header="Tipo">
                <template #body="{ data }">
                    <Tag :value="data.type" :severity="typeSeverity(data.type)" />
                </template>
            </Column>

            <Column header="Monto">
                <template #body="{ data }"> Bs {{ data.amount }} </template>
            </Column>

            <Column header="Origen">
                <template #body="{ data }">
                    {{ data.origin }}
                </template>
            </Column>

            <Column header="Referencia">
                <template #body="{ data }">
                    {{ data.reference || '-' }}
                </template>
            </Column>
        </DataTable>

        <!-- MODAL FILTROS -->
        <Dialog v-model:visible="showFilters" modal header="Filtros de Tesorería" style="width: 500px">
            <div class="grid grid-cols-1 gap-3">
                <!-- CAJA -->
                <div v-if="canViewAll">
                    <label class="block font-medium mb-1">Caja</label>
                    <AutoComplete v-model="selectedCashRegister" :suggestions="cashRegisterSuggestions" optionLabel="name" placeholder="Buscar caja" :loading="searchingCashRegister" @complete="searchCashRegister" class="w-full" />
                </div>

                <!-- USUARIO -->
                <div>
                    <label class="block font-medium mb-1">Usuario</label>
                    <AutoComplete v-model="selectedUser" :suggestions="userSuggestions" optionLabel="name" placeholder="Buscar usuario" :loading="searchingUser" @complete="searchUser" class="w-full" />
                </div>

                <!-- FECHAS -->
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block font-medium mb-1">Desde</label>
                        <Calendar v-model="filters.fromDate" dateFormat="yy-mm-dd" class="w-full" />
                    </div>
                    <div>
                        <label class="block font-medium mb-1">Hasta</label>
                        <Calendar v-model="filters.toDate" dateFormat="yy-mm-dd" class="w-full" />
                    </div>
                </div>

                <!-- TIPO -->
                <div>
                    <label class="block font-medium mb-1">Tipo</label>
                    <Dropdown
                        v-model="filters.type"
                        :options="[
                            { label: 'Ingreso (IN)', value: 'IN' },
                            { label: 'Egreso (OUT)', value: 'OUT' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todos"
                        class="w-full"
                    />
                </div>

                <!-- ORIGEN -->
                <div>
                    <label class="block font-medium mb-1">Origen</label>
                    <Dropdown
                        v-model="filters.origin"
                        :options="[
                            { label: 'Venta', value: 'SALE' },
                            { label: 'Pago', value: 'PAYMENT' },
                            { label: 'Ingreso manual', value: 'MANUAL_IN' },
                            { label: 'Egreso manual', value: 'MANUAL_OUT' },
                            { label: 'Ajuste', value: 'ADJUSTMENT' },
                            { label: 'Devolución', value: 'RETURN' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todos"
                        class="w-full"
                    />
                </div>
            </div>

            <template #footer>
                <Button label="Limpiar" severity="secondary" @click="resetFilters" />
                <Button label="Aplicar filtros" severity="success" @click="applyFilters" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
