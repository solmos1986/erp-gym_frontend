<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../service/api';
import partnerService from '../../service/partner.service';
import salesService from '../../service/sale.service';
import { useAuthStore } from '../../store/auth.store';
import ConfirmSaleModal from '../erp/ConfirmSaleModal.vue';
import SaleTicket from '../erp/SaleTicket.vue';

const toast = useToast();
const router = useRouter();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const sales = ref([]);
const loading = ref(false);

// impresión
const showPrint = ref(false);
const currentSale = ref(null);

// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('ERP_SALES_VIEW'));
//const canCancel = computed(() => auth.can('ERP_SALES_CANCEL'));

//===================
// SHOW CONFIRM SALES MODAL AND PAYMENT
//=====================
const showConfirmModal = ref(false);
const selectedSaleForPayment = ref(null);

// =====================
// FILTROS
// =====================
const paymentMethodOptions = ref([]);
const showFilters = ref(false);
// =====================
// ESTADOS DE FILTRO
// =====================
const filters = ref({
    status: null,
    fromDate: null,
    toDate: null,
    partnerId: null,
    userId: null,
    cashRegisterId: null,
    paymentMethodOptionId: null
});
// =====================
// AUTOCOMPLETE FILTROS
// =====================

// Cliente
const selectedPartner = ref(null);
const partnerSuggestions = ref([]);
const searchingPartner = ref(false);

// Cajero
const selectedUser = ref(null);
const userSuggestions = ref([]);
const searchingUser = ref(false);

// Caja
const selectedCashRegister = ref(null);
const cashRegisterSuggestions = ref([]);
const searchingCashRegister = ref(false);

function openFilters() {
    console.log('llegue para abrir modalfiltros');
    showFilters.value = true;
}

//function closeFilters() {
//    showFilters.value = false;
//}

// =====================
// CARGA DE VENTAS
// =====================
async function loadSales(params = {}) {
    loading.value = true;
    try {
        sales.value = await salesService.getAll(params);
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las ventas',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await loadSales();
    paymentMethodOptions.value = await salesService.getPaymentMethodOptions();
});

// =====================
// ACCIONES
// =====================

// DRAFT → Confirmar (por ahora solo mensaje)
// function handleConfirmSale(sale) {
//     toast.add({
//         severity: 'info',
//         summary: 'Confirmar venta',
//         detail: `Aquí abrirá el modal de confirmación para la venta #${sale.id}`,
//         life: 3000
//     });
// }

// PARTIAL → Cobrar (por ahora solo mensaje)
// function handlePaySale(sale) {
//     toast.add({
//         severity: 'info',
//         summary: 'Cobrar venta',
//         detail: `Aquí abrirá el modal de cobro para la venta #${sale.id}`,
//         life: 3000
//     });
// }

// PAID / PARTIAL → Reimprimir
async function printSale(sale) {
    try {
        const printed = await salesService.printSale(sale.id);

        currentSale.value = printed;
        showPrint.value = true;

        setTimeout(() => {
            window.print();
            showPrint.value = false;
            currentSale.value = null;
        }, 300);

        toast.add({
            severity: 'success',
            summary: 'Ticket listo para imprimir',
            detail: `Ticket Nº ${printed.ticketNumber}`,
            life: 3000
        });
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error al imprimir',
            detail: e.response?.data?.message || 'No se pudo imprimir la venta',
            life: 4000
        });
    }
}

// Navegar al POS
function goToPos() {
    router.push('/pos');
}

// =====================
// HELPERS DE UI
// =====================
function statusSeverity(status) {
    switch (status) {
        case 'DRAFT':
            return 'warning';
        case 'PARTIAL':
            return 'info';
        case 'PAID':
            return 'success';
        case 'CANCELLED':
            return 'danger';
        default:
            return 'secondary';
    }
}
// =====================
// ABRIR CONFIRM SALES MODAL
// =====================
function openConfirmModal(sale) {
    selectedSaleForPayment.value = sale;
    showConfirmModal.value = true;
}
function onSaleConfirmed() {
    showConfirmModal.value = false;
    selectedSaleForPayment.value = null;
    loadSales();
}
async function applyFilters() {
    try {
        loading.value = true;

        sales.value = await salesService.getAll({
            status: filters.value.status,
            fromDate: filters.value.fromDate,
            toDate: filters.value.toDate,
            partnerId: selectedPartner.value?.id || null,
            userId: selectedUser.value?.id || null,
            cashRegisterId: selectedCashRegister.value?.id || null,
            paymentMethodOptionId: filters.value.paymentMethodOptionId
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

function resetFilters() {
    filters.value = {
        status: null,
        fromDate: null,
        toDate: null,
        partnerId: null,
        userId: null,
        cashRegisterId: null,
        paymentMethodOptionId: null
    };

    selectedPartner.value = null;
    selectedUser.value = null;
    selectedCashRegister.value = null;

    loadSales();
    showFilters.value = false;
}

// =====================
// SEARCH CLIENTES
// =====================
async function searchPartner(event) {
    if (!event.query || event.query.length < 2) {
        partnerSuggestions.value = [];
        return;
    }

    searchingPartner.value = true;
    try {
        partnerSuggestions.value = await partnerService.search(event.query);
    } finally {
        searchingPartner.value = false;
    }
}

// =====================
// SEARCH USUARIOS
// =====================
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

// =====================
// SEARCH CAJAS
// =====================
async function searchCashRegister(event) {
    if (!event.query || event.query.length < 1) {
        cashRegisterSuggestions.value = [];
        return;
    }

    searchingCashRegister.value = true;
    try {
        const res = await api.get('/cashregister/search', {
            params: { q: event.query }
        });
        cashRegisterSuggestions.value = res.data;
    } finally {
        searchingCashRegister.value = false;
    }
}
</script>

<template>
    <div class="card">
        <!-- TOOLBAR -->
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Nueva Venta" icon="pi pi-plus" severity="success" @click="goToPos" />
            </template>
            <template #end>
                <Button label="Filtros" icon="pi pi-filter" severity="secondary" @click="openFilters" />
            </template>
        </Toolbar>
        <div class="flex justify-content-between mb-3">
            <h3>Ventas</h3>
        </div>
        <!-- TABLA -->
        <DataTable v-if="canView" :value="sales" :loading="loading" paginator :rows="10" responsiveLayout="scroll">
            <Column field="ticketNumber" header="Ticket" />

            <Column header="Fecha">
                <template #body="{ data }">
                    <span v-if="data.saleDate">
                        {{ new Date(data.saleDate).toLocaleString() }}
                    </span>
                    <span v-else class="text-gray-400 italic"> {{ new Date(data.createdAt).toLocaleString() }} (borrador) </span>
                </template>
            </Column>

            <Column header="Cliente">
                <template #body="{ data }">
                    {{ data.partner?.name || '-' }}
                </template>
            </Column>

            <Column header="Total">
                <template #body="{ data }"> Bs {{ data.total }} </template>
            </Column>

            <Column field="status" header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="statusSeverity(data.status)" />
                </template>
            </Column>
            <Column header="Cajero">
                <template #body="{ data }">
                    {{ data.user?.name || '-' }}
                </template>
            </Column>
            <Column header="Caja">
                <template #body="{ data }">
                    {{ data.cashRegister?.name || '-' }}
                </template>
            </Column>
            <Column header="Pagos">
                <template #body="{ data }">
                    <div v-if="data.paymentMethods?.length">
                        <div v-for="pm in data.paymentMethods" :key="pm.id" class="text-xs">{{ pm.methodOption?.name }}: Bs {{ pm.amount }}</div>
                    </div>
                    <span v-else>-</span>
                </template>
            </Column>
            <Column header="Pagado">
                <template #body="{ data }"> Bs {{ data.paymentMethods ? data.paymentMethods.reduce((s, p) => s + Number(p.amount), 0) : 0 }} </template>
            </Column>
            <Column header="Deuda">
                <template #body="{ data }">
                    <span v-if="data.status === 'PARTIAL'" class="text-red-600 font-bold"> Bs {{ data.total - data.paymentMethods.reduce((s, p) => s + Number(p.amount), 0) }} </span>
                    <span v-else>0</span>
                </template>
            </Column>
            <!-- ACCIONES DINÁMICAS -->
            <Column header="Acciones" style="width: 160px">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <!-- DRAFT → Confirmar venta -->
                        <Button v-if="data.status === 'DRAFT'" icon="pi pi-check" severity="success" text v-tooltip="'Confirmar venta'" @click="openConfirmModal(data)" />

                        <!-- PARTIAL → Cobrar deuda -->
                        <Button v-if="data.status === 'PARTIAL'" icon="pi pi-money-bill" severity="warning" text v-tooltip="'Registrar pago'" @click="openConfirmModal(data)" />

                        <!-- PARTIAL y PAID → Reimprimir -->
                        <Button v-if="data.status === 'PARTIAL' || data.status === 'PAID'" icon="pi pi-print" severity="info" text v-tooltip="'Reimprimir ticket'" @click="printSale(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- TICKET (REIMPRESIÓN) -->
        <SaleTicket v-if="showPrint && currentSale" :sale="currentSale" companyName="Mi Empresa S.R.L." branchName="Sucursal Central" />
        <ConfirmSaleModal v-if="showConfirmModal && selectedSaleForPayment" :visible="showConfirmModal" :sale="selectedSaleForPayment" @close="showConfirmModal = false" @confirmed="onSaleConfirmed" />
        <Dialog v-model:visible="showFilters" modal header="Filtros de ventas" style="width: 500px">
            <div class="grid grid-cols-1 gap-3">
                <!-- ESTADO -->
                <div>
                    <label class="block font-medium mb-1">Estado</label>
                    <Dropdown
                        v-model="filters.status"
                        :options="[
                            { label: 'DRAFT', value: 'DRAFT' },
                            { label: 'PAID', value: 'PAID' },
                            { label: 'PARTIAL', value: 'PARTIAL' },
                            { label: 'CANCELLED', value: 'CANCELLED' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todos"
                        class="w-full"
                    />
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

                <!-- CLIENTE -->
                <div>
                    <label class="block font-medium mb-1">Cliente</label>
                    <AutoComplete v-model="selectedPartner" :suggestions="partnerSuggestions" optionLabel="name" placeholder="Buscar cliente" :loading="searchingPartner" @complete="searchPartner" class="w-full" />
                </div>

                <!-- CAJERO -->
                <div>
                    <label class="block font-medium mb-1">Cajero</label>
                    <AutoComplete v-model="selectedUser" :suggestions="userSuggestions" optionLabel="name" placeholder="Buscar cajero" :loading="searchingUser" @complete="searchUser" class="w-full" />
                </div>

                <!-- CAJA -->
                <div>
                    <label class="block font-medium mb-1">Caja</label>
                    <AutoComplete v-model="selectedCashRegister" :suggestions="cashRegisterSuggestions" optionLabel="name" placeholder="Buscar caja" :loading="searchingCashRegister" @complete="searchCashRegister" class="w-full" />
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
