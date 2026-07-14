<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

import { formatDate, formatDateTimeNoTZ2 } from '@/utils/date';
import MembershipService from '../../../service/membership.service';
import PartnerService from '../../../service/partner.service';
import PlanService from '../../../service/plan.service';
import UserService from '../../../service/user.service';
import { useAuthStore } from '../../../store/auth.store';

// 🔥 NUEVO (WS)
let ws;

// =====================
// WS CONNECT
// =====================
function connectWebSocket() {
    ws = new WebSocket('wss://apigymcloud.aplus-security.com/ws/');

    ws.onopen = () => {
        console.log('🟢 WS conectado (frontend)');

        ws.send(
            JSON.stringify({
                type: 'REGISTER_FRONTEND'
            })
        );
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('📥 WS:', data);

        // 🔥 SOLO RECARGA CUANDO HAY CAMBIOS
        if (data.type === 'MEMBERSHIP_UPDATE') {
            console.log('🔄 Recargando memberships...');
            await loadAll();
        }
    };

    ws.onclose = () => {
        console.log('🔴 WS desconectado, reconectando...');
        setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = (err) => {
        console.error('❌ WS error:', err);
    };
}

// =====================
// TU CÓDIGO ORIGINAL
// =====================
const toast = useToast();
const auth = useAuthStore();

const memberships = ref([]);
const partners = ref([]);
const plans = ref([]);
const users = ref([]);

const loading = ref(false);
const purchaseLoading = ref(false);
const dialogVisible = ref(false);

const selectedStatus = ref(null);
const selectedPartner = ref(null);
const filteredPartners = ref([]);
const form = ref({
    partnerId: '',
    planId: '',
    payments: []
});

const filters = ref({
    search: '',
    planId: null,
    userId: null,
    status: null,
    from: null,
    to: null
});

const statusOptions = [
    { label: 'Activas', value: 'ACTIVE' },
    { label: 'Vencidas', value: 'EXPIRED' },
    { label: 'Futuras', value: 'FUTURE' }
];

const canView = computed(() => auth.can('TENANT_MEMBERSHIP_VIEW'));
const canCreate = computed(() => auth.can('TENANT_MEMBERSHIP_CREATE'));
const selectedSale = ref(null);

const annulDialog = ref(false);
const selectedPlan = computed(() => plans.value.find((p) => p.id === form.value.planId));

const total = computed(() => Number(selectedPlan.value?.price || 0));
const paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'QR', value: 'QR' },
    { label: 'Tarjeta', value: 'CARD' },
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Depósito', value: 'DEPOSIT' }
];

const paymentRow = () => ({
    method: 'CASH',
    amount: 0,
    reference: ''
});
function addPayment() {
    form.value.payments.push(paymentRow());
}

function removePayment(index) {
    if (form.value.payments.length <= 1) return;

    form.value.payments.splice(index, 1);
}

async function loadAll() {
    loading.value = true;

    try {
        const params = {
            search: filters.value.search,
            planId: filters.value.planId,
            userId: filters.value.userId,
            status: filters.value.status,
            from: filters.value.from,
            to: filters.value.to
        };
        console.log('Cargando memberships con params:', params);
        const data = await MembershipService.getAll(params);
        console.log('Cargando memberships con params:', params);
        memberships.value = data.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));

        partners.value = await PartnerService.getAll({
            type: 'CUSTOMER'
        });
        plans.value = await PlanService.getAll();
        users.value = await UserService.getAll();
    } finally {
        loading.value = false;
    }
}
function searchPartners(event) {
    console.log('buscando:', event.query);

    const query = event.query.toLowerCase();

    filteredPartners.value = partners.value.filter((p) => p.name.toLowerCase().includes(query));

    console.log('resultados:', filteredPartners.value);
}
const getPDFBlob = async () => {
    const response = await MembershipService.getReportPDF(filters.value);

    return new Blob([response.data], {
        type: 'application/pdf'
    });
};

const viewPDF = async () => {
    try {
        const blob = await getPDFBlob();
        const url = window.URL.createObjectURL(blob);

        const newWindow = window.open();
        newWindow.location.href = url;
    } catch (error) {
        console.error('PDF VIEW ERROR:', error);
    }
};

const syncStatus = (sale) => {
    const membership = sale.commands?.find((c) => c.type === 'SYNC_USER_FULL');
    //const face = sale.commands?.find((c) => c.type === 'SYNC_FACE');

    if (!membership) return 'N/A';

    const statuses = [membership.status];

    if (statuses.includes('ERROR')) return 'ERROR';
    if (statuses.includes('PENDING')) return 'PENDING';
    if (statuses.includes('PROCESSING')) return 'PROCESSING';
    if (statuses.every((s) => s === 'DONE')) return 'DONE';

    return 'N/A';
};

const getSyncLabel = (status) => {
    switch (status) {
        case 'DONE':
            return '🟢 Listo';
        case 'ERROR':
            return '🔴 Error';
        case 'PENDING':
            return '🟡 Pendiente';
        case 'PROCESSING':
            return '🟠 Sincronizando';
        default:
            return '⚪ N/A';
    }
};

watch(filters, loadAll, { deep: true });

function openCreate() {
    form.value = {
        partnerId: '',
        planId: '',
        payments: [paymentRow()]
    };

    selectedStatus.value = null;
    dialogVisible.value = true;
}

watch(
    () => form.value.partnerId,
    async (val) => {
        if (!val) return;

        try {
            selectedStatus.value = await MembershipService.getStatus(val);
        } catch {
            selectedStatus.value = null;
        }
    }
);
watch(selectedPartner, (val) => {
    form.value.partnerId = val?.id || '';
});
watch(
    () => form.value.planId,
    (planId) => {
        if (!planId) return;

        const plan = plans.value.find((p) => p.id === planId);

        form.value.payments = [
            {
                method: 'CASH',
                amount: Number(plan?.price || 0),
                reference: ''
            }
        ];
    }
);
watch(dialogVisible, (val) => {
    if (!val) {
        resetDialog();
    }
});
function resetDialog() {
    form.value = {
        partnerId: '',
        planId: '',
        payments: [paymentRow()]
    };

    selectedPartner.value = null;

    selectedStatus.value = null;

    filteredPartners.value = [];
}

async function purchase() {
    if (purchaseLoading.value) return;

    purchaseLoading.value = true;

    try {
        if (!form.value.partnerId || !form.value.planId) {
            toast.add({
                severity: 'warn',
                summary: 'Cliente y plan son obligatorios',
                life: 3000
            });

            return;
        }

        const paidTotal = form.value.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

        if (paidTotal !== total.value) {
            toast.add({
                severity: 'warn',
                summary: `Los pagos deben sumar Bs ${total.value}`,
                life: 4000
            });

            return;
        }

        await MembershipService.purchase({
            partnerId: form.value.partnerId,
            planId: form.value.planId,
            payments: form.value.payments
        });

        toast.add({
            severity: 'success',
            summary: 'Membresía procesada correctamente',
            life: 3000
        });

        dialogVisible.value = false;

        await loadAll();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: e?.response?.data?.message || 'Error procesando membresía',
            life: 3000
        });
    } finally {
        purchaseLoading.value = false;
    }
}
const getSyncTooltip = (sale) => {
    const cmd = sale.commands?.find((c) => c.status === 'ERROR');

    if (!cmd?.error) return null;

    try {
        const e = JSON.parse(cmd.error);

        switch (e.errorMsg) {
            case 'saveFacePic':
                return '⚠️ No se pudo procesar la fotografía.\n\nActualice la fotografía del cliente y sincronice nuevamente.';

            default:
                return '⚠️ Ocurrió un error de sincronización.\n\nPresione Retry para intentar nuevamente.';
        }
    } catch {
        const error = cmd.error.toLowerCase();

        if (error.includes('fetch')) {
            return '⚠️ No se pudo conectar con el dispositivo.\n\nVerifique la conexión de red y vuelva a intentar.';
        }

        if (error.includes('unexpected token')) {
            return '⚠️ El dispositivo respondió con un formato inesperado.\n\nPresione Retry. Si el problema continúa, contacte al administrador.';
        }

        return '⚠️ Error de sincronización.\n\nPresione Retry para intentar nuevamente.';
    }
};
function formatCurrency(value) {
    if (!value) return '0 Bs';
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB'
    }).format(value);
}

const getTagClass = (status) => {
    const map = {
        DONE: 'tag-done',
        ERROR: 'tag-error',
        PENDING: 'tag-pending',
        PROCESSING: 'tag-processing'
    };

    return map[status] || 'tag-default';
};

const hasRetry = (sale) => {
    return sale.commands?.some((c) => c.type === 'SYNC_USER_FULL' && c.status === 'ERROR');
};

const retry = async (id) => {
    try {
        await MembershipService.retry(id);

        toast.add({
            severity: 'success',
            summary: 'Retry ejecutado',
            detail: 'Los comandos se reenviaron correctamente',
            life: 3000
        });

        await loadAll();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.response?.data?.error || 'No se pudo ejecutar retry',
            life: 3000
        });
    }
};
const canAnnul = (sale) => {
    // ya anulada
    if (sale.status === 'ANNULLED') return false;

    const today = new Date();

    const saleDate = new Date(sale.createdAt);

    return today.getFullYear() === saleDate.getFullYear() && today.getMonth() === saleDate.getMonth() && today.getDate() === saleDate.getDate();
};
const confirmAnnul = (sale) => {
    selectedSale.value = sale;

    annulDialog.value = true;
};
const annulSale = async () => {
    try {
        await MembershipService.annul(selectedSale.value.id);

        toast.add({
            severity: 'success',

            summary: 'Éxito',

            detail: 'Inscripción anulada'
        });

        annulDialog.value = false;

        loadAll();
    } catch (error) {
        toast.add({
            severity: 'error',

            summary: 'Error',

            detail: error.response?.data?.message || error.message
        });
    }
};
// =====================
// INIT
// =====================
onMounted(async () => {
    await loadAll();

    // 🔥 NUEVO: iniciar WebSocket
    connectWebSocket();
});
</script>

<template>
    <div class="card">
        <!-- TOOLBAR -->
        <Toolbar class="mb-6">
            <template #start>
                <Button v-if="canCreate" label="Vender Membresía" icon="pi pi-plus" severity="secondary" @click="openCreate" />
            </template>
        </Toolbar>

        <!-- TITLE -->
        <div class="flex justify-content-between mb-3">
            <h3>Historial de Membresías</h3>
        </div>
        <div class="flex flex-wrap gap-2 mb-3">
            <!-- Cliente -->
            <InputText v-model="filters.search" placeholder="Cliente..." />

            <!-- Plan -->
            <Dropdown v-model="filters.planId" :options="plans" option-label="name" option-value="id" placeholder="Plan" show-clear />

            <!-- Vendedor -->
            <Dropdown v-model="filters.userId" :options="users" option-label="fullName" option-value="id" placeholder="Vendedor" show-clear />

            <!-- Fecha -->
            <Calendar v-model="filters.from" placeholder="Desde" date-format="dd/mm/yy" show-icon />

            <Calendar v-model="filters.to" placeholder="Hasta" date-format="dd/mm/yy" show-icon />
            <!-- Estado -->
            <Dropdown v-model="filters.status" :options="statusOptions" placeholder="Estado" show-clear />

            <!-- Botón -->
            <Button label="Filtrar" icon="pi pi-search" @click="loadData" />

            <Button label="Ver PDF" icon="pi pi-eye" @click="viewPDF" />
        </div>
        <!-- TABLE -->

        <DataTable
            v-if="canView"
            :value="memberships"
            :loading="loading"
            paginator
            :rows="10"
            :rows-per-page-options="[10, 20, 50]"
            paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
            current-page-report-template="Mostrando {first} a {last} de {totalRecords} ventas"
            responsive-layout="scroll"
        >
            <Column header="Venta">
                <template #body="{ data }">
                    {{ formatDate(data.saleDate) }}
                </template>
            </Column>
            <Column header="Vendedor">
                <template #body="{ data }">
                    {{ data.user?.fullName || '—' }}
                </template>
            </Column>
            <Column header="Plan">
                <template #body="{ data }">
                    {{ data.plan?.name }}
                </template>
            </Column>

            <Column header="Precio">
                <template #body="{ data }">
                    {{ formatCurrency(data.price) }}
                </template>
            </Column>
            <Column header="Cliente">
                <template #body="{ data }">
                    {{ data.partner?.name }}
                </template>
            </Column>

            <Column header="Inicio">
                <template #body="slotProps">
                    {{ formatDateTimeNoTZ2(slotProps.data.startDate) }}
                </template>
            </Column>
            <Column header="Fin">
                <template #body="slotProps">
                    {{ formatDateTimeNoTZ2(slotProps.data.endDate) }}
                </template>
            </Column>

            <Column header="Sync">
                <template #body="{ data }">
                    <Tag
                        v-tooltip.bottom="{
                            value: getSyncTooltip(data),
                            class: 'sync-tooltip'
                        }"
                        :value="getSyncLabel(syncStatus(data))"
                        :class="getTagClass(syncStatus(data))"
                    />
                </template>
            </Column>
            <Column header="Acciones">
                <template #body="{ data }">
                    <Button v-if="hasRetry(data)" icon="pi pi-sync" severity="secondary" text @click="retry(data.id)" />
                    <Button v-if="canAnnul(data)" icon="pi pi-times" severity="danger" text rounded @click="confirmAnnul(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="Vender Membresía" style="width: 400px">
            <!-- CLIENTE -->
            <div class="field">
                <label>Cliente</label>
                <AutoComplete v-model="selectedPartner" :suggestions="filteredPartners" option-label="name" field="name" :min-length="1" dropdown @complete="searchPartners" />
            </div>

            <!-- ESTADO -->
            <div v-if="selectedStatus" class="mb-3">
                <small>
                    Estado:
                    <b>{{ selectedStatus.status }}</b>
                </small>
                <br />
                <small v-if="selectedStatus.endDate">Vigente hasta: {{ selectedStatus.endDate }}</small>
            </div>

            <!-- PLAN -->
            <div class="field">
                <label>Plan</label>
                <Dropdown v-model="form.planId" :options="plans" option-label="name" option-value="id" placeholder="Seleccionar plan" class="w-full" />
            </div>
            <div v-if="selectedPlan" class="mb-3">
                <strong>Total: {{ formatCurrency(total) }}</strong>
            </div>

            <div class="mb-3">
                <div v-for="(payment, index) in form.payments" :key="index" class="grid mb-2">
                    <div class="col-4">
                        <Dropdown v-model="payment.method" :options="paymentMethods" option-label="label" option-value="value" class="w-full" />
                    </div>

                    <div class="col-4">
                        <InputNumber v-model="payment.amount" mode="decimal" :min="0" class="w-full" />
                    </div>

                    <div class="col-3">
                        <InputText v-model="payment.reference" placeholder="Referencia" class="w-full" />
                    </div>

                    <div class="col-1">
                        <Button icon="pi pi-trash" severity="danger" text @click="removePayment(index)" />
                    </div>
                </div>

                <Button label="Agregar método" icon="pi pi-plus" severity="secondary" text @click="addPayment" />
            </div>

            <!-- ACTIONS -->
            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Confirmar Pago" severity="success" :loading="purchaseLoading" :disabled="purchaseLoading" @click="purchase" />
            </div>
        </Dialog>
        <Dialog v-model:visible="annulDialog" header="Anular inscripción" modal :style="{ width: '30rem' }">
            <div class="flex flex-column gap-2">
                <span>
                    Cliente:
                    <b>
                        {{ selectedSale?.customer?.fullName }}
                    </b>
                </span>

                <span>
                    Plan:
                    <b>
                        {{ selectedSale?.plan?.name }}
                    </b>
                </span>

                <span>¿Desea anular esta inscripción?</span>
            </div>

            <template #footer>
                <Button label="Cancelar" text @click="annulDialog = false" />

                <Button label="Anular" severity="danger" @click="annulSale" />
            </template>
        </Dialog>
    </div>
</template>
