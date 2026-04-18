<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import purchaseService from '../../service/purchase.service';
import { useAuthStore } from '../../store/auth.store';
import PurchaseConfirmModal from './PurchaseConfirmModal.vue';
import PurchaseFormModal from './PurchaseFormModal.vue';
import PurchasePayModal from './PurchasePayModal.vue';
import PurchaseReceiveModal from './PurchaseReceiveModal.vue';
import PurchaseViewModal from './PurchaseViewModal.vue';
const showCreateModal = ref(false);
const toast = useToast();
// const router = useRouter();
const auth = useAuthStore();
const showReceiveModal = ref(false);
const selectedPurchase = ref(null);
const showPayModal = ref(false);
const selectedPurchaseForPay = ref(null);
const showConfirmModal = ref(false);
const showViewModal = ref(false);
const loadingView = ref(false);
// =====================
// ESTADOS
// =====================
const purchases = ref([]);
const loading = ref(false);

// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('ERP_PURCHASES_VIEW'));

// =====================
// CARGA
// =====================
async function loadPurchases(params = {}) {
    loading.value = true;
    try {
        purchases.value = await purchaseService.getAll(params);
        console.log('PURCHASES LOADED:', purchases.value);
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las compras',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}
function openCreate() {
    console.log('Opening create purchase modal');
    showCreateModal.value = true;
}

function onCreated() {
    showCreateModal.value = false;
    loadPurchases();
}
function openReceive(purchase) {
    console.log('Selected purchase for receiving:', purchase);
    selectedPurchase.value = purchase;
    showReceiveModal.value = true;
}

function onReceived() {
    showReceiveModal.value = false;
    selectedPurchase.value = null;
    loadPurchases();
}
function openPayModal(purchase) {
    selectedPurchaseForPay.value = purchase;
    showPayModal.value = true;
}
function openConfirm(purchase) {
    selectedPurchase.value = purchase;
    showConfirmModal.value = true;
}
async function openEdit(purchase) {
    const full = await purchaseService.getById(purchase.id);
    selectedPurchase.value = full;
    showCreateModal.value = true;
}
async function cancelPurchase(purchase) {
    try {
        await purchaseService.cancelPurchase(purchase.id);

        toast.add({
            severity: 'success',
            summary: 'Compra cancelada',
            life: 3000
        });

        loadPurchases();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'No se pudo cancelar',
            life: 4000
        });
    }
}

function onPurchaseConfirmed() {
    showConfirmModal.value = false;
    loadPurchases();
}
async function onPaid() {
    showPayModal.value = false;
    selectedPurchaseForPay.value = null;
    await loadPurchases();
}
onMounted(() => {
    loadPurchases();
});

// =====================
// ACCIONES
// =====================
// function goToCreate() {
//     router.push('/purchases/create');
// }

// function openReceive(purchase) {
//     router.push(`/purchases/${purchase.id}/receive`);
// }

// function openPayments(purchase) {
//     console.log('Selected purchase for payment:', purchase);
//     router.push(`/purchases/${purchase.id}/pay`);
// }
async function openView(purchase) {
    try {
        loadingView.value = true;

        const fullPurchase = await purchaseService.getById(purchase.id);

        selectedPurchase.value = fullPurchase;
        showViewModal.value = true;
    } catch (e) {
        console.error(e);
    } finally {
        loadingView.value = false;
    }
}
// =====================
// UI HELPERS
// =====================
function statusSeverity(status) {
    switch (status) {
        case 'DRAFT':
            return 'warning';
        case 'CONFIRMED':
            return 'info';
        case 'CANCELLED':
            return 'danger';
        default:
            return 'secondary';
    }
}

function paymentSeverity(status) {
    switch (status) {
        case 'CREDIT':
            return 'warning';
        case 'PARTIAL':
            return 'info';
        case 'PAID':
            return 'success';
        default:
            return 'secondary';
    }
}

function receiveSeverity(status) {
    switch (status) {
        case 'PENDING':
            return 'warning';
        case 'PARTIAL':
            return 'info';
        case 'RECEIVED':
            return 'success';
        default:
            return 'secondary';
    }
}
</script>

<template>
    <div class="card">
        <!-- TOOLBAR -->
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Nueva Compra" icon="pi pi-plus" severity="success" @click="openCreate" />
            </template>
        </Toolbar>

        <h3 class="mb-3">Compras</h3>

        <DataTable v-if="canView" :value="purchases" :loading="loading" paginator :rows="10" responsiveLayout="scroll">
            <Column field="id" header="ID" />

            <Column header="Fecha">
                <template #body="{ data }">
                    <span v-if="data.purchaseDate">
                        {{ new Date(data.purchaseDate).toLocaleString() }}
                    </span>
                    <span v-else>
                        {{ new Date(data.createdAt).toLocaleString() }}
                    </span>
                </template>
            </Column>

            <Column header="Proveedor">
                <template #body="{ data }">
                    {{ data.partner?.name || '-' }}
                </template>
            </Column>

            <Column header="Total">
                <template #body="{ data }"> Bs {{ data.total }} </template>
            </Column>

            <!-- STATUS DOCUMENTO -->
            <Column header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="statusSeverity(data.status)" />
                </template>
            </Column>

            <!-- STATUS PAGO -->
            <Column header="Pago">
                <template #body="{ data }">
                    <Tag :value="data.paymentStatus" :severity="paymentSeverity(data.paymentStatus)" />
                </template>
            </Column>

            <!-- STATUS RECEPCION -->
            <Column header="Recepción">
                <template #body="{ data }">
                    <Tag :value="data.receiveStatus" :severity="receiveSeverity(data.receiveStatus)" />
                </template>
            </Column>

            <Column header="Usuario">
                <template #body="{ data }">
                    {{ data.user?.name || '-' }}
                </template>
            </Column>

            <!-- ACCIONES -->
            <Column header="Acciones" style="width: 200px">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <!-- Confirmar -->
                        <Button v-if="data.status === 'DRAFT'" icon="pi pi-check" severity="success" text v-tooltip="'Confirmar'" @click="openConfirm(data)" />

                        <!-- Registrar Pago -->
                        <Button v-if="data.status === 'CONFIRMED' && data.paymentStatus !== 'PAID'" icon="pi pi-money-bill" severity="warning" text v-tooltip="'Registrar pago'" @click="openPayModal(data)" />

                        <!-- Recibir -->
                        <Button v-if="data.status === 'CONFIRMED' && data.receiveStatus !== 'RECEIVED'" icon="pi pi-download" severity="info" text v-tooltip="'Recibir mercadería'" @click="openReceive(data)" />
                        <Button icon="pi pi-eye" severity="secondary" text v-tooltip="'Ver compra'" @click="openView(data)" />
                        <Button v-if="data.status !== 'CANCELLED'" icon="pi pi-times" severity="danger" text v-tooltip="'Cancelar compra'" @click="cancelPurchase(data)" />
                        <Button v-if="data.status === 'DRAFT'" icon="pi pi-pencil" severity="warning" text v-tooltip="'Editar compra'" @click="openEdit(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
    <PurchaseFormModal :visible="showCreateModal" :purchase="selectedPurchase" @close="showCreateModal = false" @created="onCreated" />
    <PurchaseReceiveModal :visible="showReceiveModal" :purchase="selectedPurchase" @close="showReceiveModal = false" @received="onReceived" />
    <PurchasePayModal :visible="showPayModal" :purchase="selectedPurchaseForPay" @close="showPayModal = false" @paid="onPaid" />
    <PurchaseConfirmModal :visible="showConfirmModal" :purchase="selectedPurchase" @close="showConfirmModal = false" @confirmed="onPurchaseConfirmed" />
    <PurchaseViewModal :visible="showViewModal" :purchase="selectedPurchase" @close="showViewModal = false" />
</template>
