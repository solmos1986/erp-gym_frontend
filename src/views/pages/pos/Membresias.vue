<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

import { formatDate } from '@/utils/date';
import MembershipService from '../../../service/membership.service';
import PartnerService from '../../../service/partner.service';
import PlanService from '../../../service/plan.service';
import UserService from '../../../service/user.service'; // 👈 NUEVO
import { useAuthStore } from '../../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const memberships = ref([]);
const partners = ref([]);
const plans = ref([]);
const users = ref([]); // 👈 NUEVO

const loading = ref(false);
const dialogVisible = ref(false);

const selectedStatus = ref(null);

const form = ref({
    partnerId: '',
    planId: ''
});

const filters = ref({
    search: null,
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

// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_MEMBERSHIP_VIEW'));
const canCreate = computed(() => auth.can('TENANT_MEMBERSHIP_CREATE'));

// =====================
// CARGA (CON FILTROS 🔥)
// =====================
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

        memberships.value = await MembershipService.getAll(params);

        // Estos no necesitan filtros
        partners.value = await PartnerService.getAll();
        plans.value = await PlanService.getAll();

        // 👇 opcional (si tienes endpoint de users)
        users.value = await UserService.getAll();
    } finally {
        loading.value = false;
    }
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
    const membership = sale.commands?.find((c) => c.type === 'SYNC_MEMBERSHIP');
    const face = sale.commands?.find((c) => c.type === 'SYNC_FACE');

    if (!membership || !face) return 'N/A';

    const statuses = [membership.status, face.status];

    if (statuses.includes('ERROR')) return 'ERROR';
    if (statuses.includes('PENDING')) return 'PENDING';
    if (statuses.includes('PROCESSING')) return 'PROCESSING';
    if (statuses.every((s) => s === 'DONE')) return 'DONE';

    return 'N/A';
};
const getTagSeverity = (status) => {
    switch (status) {
        case 'DONE':
            return 'success';
        case 'ERROR':
            return 'danger';
        case 'PENDING':
            return 'warning';
        case 'PROCESSING':
            return 'warning';
        default:
            return 'info'; // 👈 NUNCA null
    }
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
// =====================
// AUTO FILTRO (UX PRO)
// =====================
watch(filters, loadAll, { deep: true });

// =====================
// MODAL
// =====================
function openCreate() {
    form.value = {
        partnerId: '',
        planId: ''
    };

    selectedStatus.value = null;
    dialogVisible.value = true;
}

// =====================
// ESTADO CLIENTE
// =====================
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

// =====================
// PURCHASE
// =====================
async function purchase() {
    try {
        if (!form.value.partnerId || !form.value.planId) {
            toast.add({
                severity: 'warn',
                summary: 'Cliente y plan son obligatorios',
                life: 3000
            });
            return;
        }

        await MembershipService.purchase(form.value);

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
    }
}

// =====================
// HELPERS
// =====================
function formatCurrency(value) {
    if (!value) return '0 Bs';
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB'
    }).format(value);
}

// =====================
// BOTON RETRY
// =====================
const getSeverity = (status) => {
    switch (status) {
        case 'DONE':
            return 'success';
        case 'ERROR':
            return 'danger';
        case 'PENDING':
            return 'warning';
        case 'PROCESSING':
            return 'warning';
        default:
            return 'N/A';
    }
};

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
    const relevant = sale.commands?.filter((c) => ['SYNC_MEMBERSHIP', 'SYNC_FACE'].includes(c.type));

    return relevant?.some((c) => c.status === 'ERROR');
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

// =====================
// COMMAND STATUS
// =====================
const getStatus = (sale, type) => {
    const cmd = sale.commands?.find((c) => c.type === type);
    return cmd?.status || 'N/A';
};

// =====================
// INIT
// =====================
onMounted(async () => {
    await loadAll();
});
</script>

<template>
    <div class="card">
        <!-- TOOLBAR -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Vender Membresía" v-if="canCreate" icon="pi pi-plus" severity="secondary"
                    @click="openCreate" />
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
            <Dropdown v-model="filters.planId" :options="plans" optionLabel="name" optionValue="id" placeholder="Plan"
                showClear />

            <!-- Vendedor -->
            <Dropdown v-model="filters.userId" :options="users" optionLabel="fullName" optionValue="id"
                placeholder="Vendedor" showClear />

            <!-- Fecha -->
            <Calendar v-model="filters.from" placeholder="Desde" dateFormat="dd/mm/yy" showIcon />

            <Calendar v-model="filters.to" placeholder="Hasta" dateFormat="dd/mm/yy" showIcon />
            <!-- Estado -->
            <Dropdown v-model="filters.status" :options="statusOptions" placeholder="Estado" showClear />

            <!-- Botón -->
            <Button label="Filtrar" icon="pi pi-search" @click="loadData" />

            <Button label="Ver PDF" icon="pi pi-eye" @click="viewPDF" />
        </div>
        <!-- TABLE -->

        <DataTable v-if="canView" :value="memberships" :loading="loading">
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
                    {{ formatDate(slotProps.data.startDate) }}
                </template>
            </Column>
            <Column header="Fin">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.endDate) }}
                </template>
            </Column>

            <Column header="Sync">
                <template #body="{ data }">
                    <Tag :value="getSyncLabel(syncStatus(data))" :class="getTagClass(syncStatus(data))" />
                </template>
            </Column>
            <Column header="Acciones">
                <template #body="{ data }">
                    <Button v-if="hasRetry(data)" label="Retry" icon="pi pi-refresh" severity="warning"
                        @click="retry(data.id)" />
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="Vender Membresía" style="width: 400px">
            <!-- CLIENTE -->
            <div class="field">
                <label>Cliente</label>
                <Dropdown v-model="form.partnerId" :options="partners" optionLabel="name" optionValue="id"
                    placeholder="Seleccionar cliente" class="w-full" />
            </div>

            <!-- ESTADO -->
            <div v-if="selectedStatus" class="mb-3">
                <small>
                    Estado:
                    <b>{{ selectedStatus.status }}</b>
                </small>
                <br />
                <small v-if="selectedStatus.endDate"> Vigente hasta: {{ selectedStatus.endDate }} </small>
            </div>

            <!-- PLAN -->
            <div class="field">
                <label>Plan</label>
                <Dropdown v-model="form.planId" :options="plans" optionLabel="name" optionValue="id"
                    placeholder="Seleccionar plan" class="w-full" />
            </div>

            <!-- ACTIONS -->
            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Confirmar Pago" severity="success" @click="purchase" />
            </div>
        </Dialog>
    </div>
</template>
