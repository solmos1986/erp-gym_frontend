<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import CashRegisterService from '@/service/cashRegister.service';
import { formatDateShort } from '@/utils/date';

const route = useRoute();

const loading = ref(false);
const cashRegister = ref(null);

// ==========================
// CARGAR CAJA
// ==========================

async function loadCashRegister() {
    loading.value = true;

    try {
        cashRegister.value = await CashRegisterService.getById(route.params.id);
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
}

// ==========================
// ESTADO
// ==========================

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

// ==========================
// MOVIMIENTOS
// ==========================

function getMovementTypeLabel(type) {
    switch (type) {
        case 'INCOME':
            return 'INGRESO';

        case 'EXPENSE':
            return 'EGRESO';

        default:
            return type;
    }
}

function getMovementTypeSeverity(type) {
    switch (type) {
        case 'INCOME':
            return 'success';

        case 'EXPENSE':
            return 'danger';

        default:
            return 'secondary';
    }
}

// ==========================
// MÉTODOS DE PAGO
// ==========================

function getPaymentMethodLabel(method) {
    switch (method) {
        case 'CASH':
            return 'EFECTIVO';

        case 'QR':
            return 'QR';

        case 'TRANSFER':
            return 'TRANSFERENCIA';

        case 'CARD':
            return 'TARJETA';

        default:
            return method;
    }
}

// ==========================
// ORIGENES
// ==========================

function getReferenceTypeLabel(type) {
    switch (type) {
        case 'MEMBERSHIP_SALE':
            return 'Membresías';

        case 'PRODUCT_SALE':
            return 'Productos';

        case 'PURCHASE':
            return 'Compras';

        case 'MANUAL_INCOME':
            return 'Ingresos Manuales';

        case 'MANUAL_EXPENSE':
            return 'Egresos Manuales';

        default:
            return type;
    }
}

// ==========================
// TOTALES
// ==========================

const totalIncome = computed(() => {
    if (!cashRegister.value) return 0;

    return cashRegister.value.movements.filter((m) => m.type === 'INCOME').reduce((sum, m) => sum + Number(m.amount), 0);
});

const totalExpense = computed(() => {
    if (!cashRegister.value) return 0;

    return cashRegister.value.movements.filter((m) => m.type === 'EXPENSE').reduce((sum, m) => sum + Number(m.amount), 0);
});

const netAmount = computed(() => {
    return totalIncome.value - totalExpense.value;
});

const totalExpected = computed(() => {
    return Number(cashRegister.value?.expectedAmount || 0);
});

const totalCounted = computed(() => {
    return Number(cashRegister.value?.countedAmount || 0);
});

const totalDifference = computed(() => {
    return Number(cashRegister.value?.difference || 0);
});
// ==========================
// RESUMEN MÉTODOS PAGO
// ==========================

const paymentSummary = computed(() => {
    if (!cashRegister.value) return [];

    const summary = {};

    cashRegister.value.movements.forEach((movement) => {
        movement.payments.forEach((payment) => {
            summary[payment.method] = (summary[payment.method] || 0) + Number(payment.amount);
        });
    });

    return Object.entries(summary).map(([method, total]) => ({
        method,
        total
    }));
});
// ==========================
// INGRESOS POR MÉTODO
// ==========================

const incomeByMethod = computed(() => {
    if (!cashRegister.value) return [];

    const summary = {};

    cashRegister.value.movements
        .filter((m) => m.type === 'INCOME')
        .forEach((movement) => {
            movement.payments.forEach((payment) => {
                summary[payment.method] = (summary[payment.method] || 0) + Number(payment.amount);
            });
        });

    return Object.entries(summary).map(([method, total]) => ({
        method,
        total
    }));
});

// ==========================
// EGRESOS POR MÉTODO
// ==========================

const expenseByMethod = computed(() => {
    if (!cashRegister.value) return [];

    const summary = {};

    cashRegister.value.movements
        .filter((m) => m.type === 'EXPENSE')
        .forEach((movement) => {
            movement.payments.forEach((payment) => {
                summary[payment.method] = (summary[payment.method] || 0) + Number(payment.amount);
            });
        });

    return Object.entries(summary).map(([method, total]) => ({
        method,
        total
    }));
});
// ==========================
// RESUMEN POR ORIGEN
// ==========================

const originSummary = computed(() => {
    if (!cashRegister.value) {
        return {
            income: [],
            expense: []
        };
    }

    const incomeMap = {};
    const expenseMap = {};

    cashRegister.value.movements.forEach((movement) => {
        const amount = Number(movement.amount);

        if (movement.type === 'INCOME') {
            incomeMap[movement.referenceType] = (incomeMap[movement.referenceType] || 0) + amount;
        }

        if (movement.type === 'EXPENSE') {
            expenseMap[movement.referenceType] = (expenseMap[movement.referenceType] || 0) + amount;
        }
    });

    return {
        income: Object.entries(incomeMap).map(([type, total]) => ({
            type,
            total
        })),

        expense: Object.entries(expenseMap).map(([type, total]) => ({
            type,
            total
        }))
    };
});

// ==========================
// INIT
// ==========================

onMounted(async () => {
    await loadCashRegister();
});
</script>
<template>
    <div>
        <div v-if="loading" class="text-center p-4">
            <ProgressSpinner />
        </div>

        <template v-else-if="cashRegister">
            <div class="mb-4">
                <h2 class="m-0 mb-3">Detalle de Caja</h2>

                <div class="flex align-items-center gap-4 flex-wrap">
                    <span class="text-600">
                        <strong>Sucursal:</strong>
                        {{ cashRegister.branch?.name }}
                    </span>
                </div>
                <div class="flex align-items-center gap-4 flex-wrap mt-2">
                    <span class="text-600">
                        <strong>Estado:</strong>
                    </span>
                    <span><Tag :value="getStatusLabel(cashRegister.status)" :severity="getStatusSeverity(cashRegister.status)" /></span>
                </div>
            </div>
            <!-- ========================= -->
            <!-- FILA SUPERIOR -->
            <!-- ========================= -->

            <div class="grid grid-cols-12 gap-4 mb-4">
                <!-- CAJA -->

                <div class="col-span-12 md:col-span-6 xl:col-span-3">
                    <div class="card">
                        <div class="flex align-items-center gap-3 mb-5">
                            <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width: 3rem; height: 3rem">
                                <i class="pi pi-dollar text-green-500 text-xl"></i>
                            </div>

                            <h5 class="m-0">Información de la caja</h5>
                        </div>

                        <div class="grid gap-4">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-calendar"></i>
                                    <span>Caja</span>
                                </div>

                                <span class="font-semibold">{{ cashRegister.branch?.name.slice(0, 8) }}</span>
                            </div>

                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-building"></i>
                                    <span>Sucursal</span>
                                </div>

                                <span class="font-semibold">
                                    {{ cashRegister.branch?.name }}
                                </span>
                            </div>

                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-clock"></i>
                                    <span>Estado</span>
                                </div>

                                <Tag :value="getStatusLabel(cashRegister.status)" :severity="getStatusSeverity(cashRegister.status)" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- APERTURA -->

                <div class="col-span-12 md:col-span-6 xl:col-span-3">
                    <div class="card">
                        <!-- HEADER -->

                        <div class="flex align-items-center gap-3 mb-5">
                            <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width: 3rem; height: 3rem">
                                <i class="pi pi-dollar text-green-500 text-xl"></i>
                            </div>

                            <h5 class="m-0">Apertura</h5>
                        </div>

                        <!-- CONTENIDO -->

                        <div class="grid gap-4">
                            <div class="flex justify-between align-items-center">
                                <span class="text-color-secondary">Abierta por</span>

                                <span class="font-semibold">
                                    {{ cashRegister.openedBy?.fullName }}
                                </span>
                            </div>

                            <div class="flex justify-between align-items-center">
                                <span class="text-color-secondary">Fecha de apertura</span>

                                <span class="font-semibold">
                                    {{ formatDateShort(cashRegister.openedAt) }}
                                </span>
                            </div>

                            <div class="flex justify-between align-items-center">
                                <span class="text-color-secondary">Monto de apertura</span>

                                <span class="font-bold text-green-500 text-xl">Bs {{ Number(cashRegister.openingAmount).toFixed(2) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-6 xl:col-span-3">
                    <div class="card">
                        <!-- HEADER -->

                        <div class="flex align-items-center gap-3 mb-5">
                            <div class="flex align-items-center justify-content-center bg-red-100 border-round" style="width: 3rem; height: 3rem">
                                <i class="pi pi-lock text-red-500 text-xl"></i>
                            </div>

                            <h5 class="m-0">Cierre</h5>
                        </div>

                        <!-- CONTENIDO -->

                        <div class="grid gap-4">
                            <div class="flex justify-between items-center">
                                <span class="text-color-secondary">Cerrada por</span>

                                <span class="font-semibold">
                                    {{ cashRegister.closedBy?.fullName || '-' }}
                                </span>
                            </div>

                            <div class="flex justify-between items-center">
                                <span class="text-color-secondary">Fecha de cierre</span>

                                <span class="font-semibold">
                                    {{ cashRegister.closedAt ? formatDateShort(cashRegister.closedAt) : '-' }}
                                </span>
                            </div>

                            <div class="flex justify-between items-center">
                                <span class="text-color-secondary">Monto contado</span>

                                <span class="font-bold text-red-500 text-xl">
                                    {{ cashRegister.countedAmount != null ? `Bs ${Number(cashRegister.countedAmount).toFixed(2)}` : '-' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6 xl:col-span-3">
                    <div class="card">
                        <h5 class="mb-5">Resumen General</h5>

                        <!-- INGRESOS -->

                        <div class="flex justify-between items-center mb-4">
                            <span class="text-lg">Total Ingresos</span>

                            <span class="font-bold text-green-500 text-2xl">Bs {{ totalIncome.toFixed(2) }}</span>
                        </div>

                        <!-- EGRESOS -->

                        <div class="flex justify-between items-center mb-4">
                            <span class="text-lg">Total Egresos</span>

                            <span class="font-bold text-red-500 text-2xl">Bs {{ totalExpense.toFixed(2) }}</span>
                        </div>

                        <Divider />

                        <!-- ESPERADO -->

                        <div class="flex justify-between items-center mb-3">
                            <span>Monto Esperado</span>

                            <span class="font-semibold">Bs {{ totalExpected.toFixed(2) }}</span>
                        </div>

                        <!-- CONTADO -->

                        <div class="flex justify-between items-center mb-4">
                            <span>Monto Contado</span>

                            <span class="font-semibold">Bs {{ totalCounted.toFixed(2) }}</span>
                        </div>

                        <!-- DIFERENCIA -->

                        <div class="border-round p-4 flex justify-between items-center" :class="totalDifference === 0 ? 'bg-green-50' : 'bg-red-50'">
                            <span class="font-bold text-xl">Diferencia</span>

                            <span class="font-bold text-3xl" :class="totalDifference === 0 ? 'text-green-500' : 'text-red-500'">Bs {{ totalDifference.toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- ========================= -->
            <!-- SEGUNDA FILA -->
            <!-- ========================= -->

            <!-- ===================================== -->
            <!-- RESUMEN POR MÉTODO DE PAGO -->
            <!-- ===================================== -->

            <div class="col-span-12 xl:col-span-6 mb-4"></div>

            <!-- ===================================== -->
            <!-- RESUMEN POR ORIGEN -->
            <!-- ===================================== -->

            <div class="col-span-12 xl:col-span-6"></div>
            <!-- ===================================== -->
            <!-- SEGUNDA FILA -->
            <!-- ===================================== -->

            <div class="grid grid-cols-12 gap-4 mb-4">
                <!-- MÉTODOS DE PAGO -->

                <div class="col-span-12 xl:col-span-6">
                    <!-- card método de pago -->
                    <div class="card h-full">
                        <h5 class="mb-5">Resumen por Método de Pago</h5>

                        <div class="grid grid-cols-12 gap-6">
                            <!-- INGRESOS -->

                            <!-- IZQUIERDA -->

                            <div class="col-span-12 md:col-span-6 pr-5" style="border-right: 1px solid var(--surface-border)">
                                <div class="h-full pr-4">
                                    <div class="text-green-600 font-bold mb-4">INGRESOS</div>

                                    <div v-for="item in incomeByMethod" :key="`income-${item.method}`" class="flex justify-between items-center mb-3">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-money-bill text-green-500"></i>

                                            <span>
                                                {{ getPaymentMethodLabel(item.method) }}
                                            </span>
                                        </div>

                                        <span class="font-semibold">Bs {{ item.total.toFixed(2) }}</span>
                                    </div>

                                    <Divider />

                                    <div class="flex justify-between items-center mt-4">
                                        <span class="font-bold text-green-600 text-lg">Total Ingresos</span>

                                        <span class="font-bold text-green-600 text-2xl">Bs {{ totalIncome.toFixed(2) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- EGRESOS -->

                            <div class="col-span-12 md:col-span-6 pl-5">
                                <div class="text-red-600 font-bold mb-4">EGRESOS</div>

                                <div v-if="expenseByMethod.length === 0" class="text-500 italic mb-3">Sin egresos</div>

                                <div v-for="item in expenseByMethod" :key="`expense-${item.method}`" class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-money-bill text-red-500"></i>

                                        <span>
                                            {{ getPaymentMethodLabel(item.method) }}
                                        </span>
                                    </div>

                                    <span class="font-semibold">Bs {{ item.total.toFixed(2) }}</span>
                                </div>

                                <Divider />

                                <div class="flex justify-between items-center mt-4">
                                    <span class="font-bold text-red-600 text-lg">Total Egresos</span>

                                    <span class="font-bold text-red-600 text-2xl">Bs {{ totalExpense.toFixed(2) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ORIGEN -->

                <div class="col-span-12 xl:col-span-6">
                    <!-- card resumen origen -->
                    <div class="card h-full">
                        <h5 class="mb-5">Resumen por Origen</h5>

                        <div class="grid grid-cols-12 gap-6">
                            <!-- INGRESOS -->

                            <div class="col-span-12 md:col-span-6 pr-5" style="border-right: 1px solid var(--surface-border)">
                                <div class="h-full pr-4">
                                    <div class="text-green-600 font-bold mb-4">INGRESOS POR ORIGEN</div>

                                    <div v-for="item in originSummary.income" :key="item.type" class="flex justify-between items-center mb-3">
                                        <span>
                                            {{ getReferenceTypeLabel(item.type) }}
                                        </span>

                                        <span class="font-semibold">Bs {{ item.total.toFixed(2) }}</span>
                                    </div>

                                    <Divider />

                                    <div class="flex justify-between items-center mt-4" style="border-right: 1px solid var(--surface-border)">
                                        <span class="font-bold text-green-600 text-lg">Total Ingresos</span>

                                        <span class="font-bold text-green-600 text-2xl">Bs {{ totalIncome.toFixed(2) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- EGRESOS -->

                            <div class="col-span-12 md:col-span-6 pl-5">
                                <div class="text-red-600 font-bold mb-4">EGRESOS POR ORIGEN</div>

                                <div v-if="originSummary.expense.length === 0" class="text-500 italic mb-3">Sin egresos</div>

                                <div v-for="item in originSummary.expense" :key="item.type" class="flex justify-between items-center mb-3">
                                    <span>
                                        {{ getReferenceTypeLabel(item.type) }}
                                    </span>

                                    <span class="font-semibold">Bs {{ item.total.toFixed(2) }}</span>
                                </div>

                                <Divider />

                                <div class="flex justify-between items-center mt-4">
                                    <span class="font-bold text-red-600 text-lg">Total Egresos</span>

                                    <span class="font-bold text-red-600 text-2xl">Bs {{ totalExpense.toFixed(2) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- ========================= -->
            <!-- TERCERA FILA -->
            <!-- ========================= -->
            <!-- ===================================== -->
            <!-- MOVIMIENTOS DE CAJA -->
            <!-- ===================================== -->

            <div class="col-span-12">
                <div class="card">
                    <!-- HEADER -->

                    <div class="flex justify-between items-center mb-4">
                        <h5 class="m-0">Movimientos de Caja</h5>

                        <div class="flex gap-2">
                            <Button icon="pi pi-filter" label="Filtrar" outlined size="small" />

                            <Button icon="pi pi-eye-slash" label="Ver anulados" outlined size="small" />
                        </div>
                    </div>

                    <!-- TABLA -->

                    <DataTable :value="cashRegister.movements" scrollable scroll-height="450px" striped-rows responsive-layout="scroll">
                        <Column header="Fecha">
                            <template #body="{ data }">
                                {{ formatDateShort(data.createdAt) }}
                            </template>
                        </Column>

                        <Column header="Tipo">
                            <template #body="{ data }">
                                <Tag :value="getMovementTypeLabel(data.type)" :severity="getMovementTypeSeverity(data.type)" />
                            </template>
                        </Column>

                        <Column header="Origen">
                            <template #body="{ data }">
                                <Tag :value="data.referenceType" severity="info" />
                            </template>
                        </Column>

                        <Column header="Método de Pago">
                            <template #body="{ data }">
                                <span v-if="data.payments?.length">
                                    {{ getPaymentMethodLabel(data.payments[0].method) }}
                                </span>

                                <span v-else>-</span>
                            </template>
                        </Column>

                        <Column field="description" header="Descripción" />

                        <Column header="Monto">
                            <template #body="{ data }">
                                <span
                                    :class="{
                                        'text-green-600 font-semibold': data.type === 'INCOME',

                                        'text-red-600 font-semibold': data.type === 'EXPENSE'
                                    }"
                                >
                                    Bs {{ Number(data.amount).toFixed(2) }}
                                </span>
                            </template>
                        </Column>

                        <Column header="Usuario">
                            <template #body="{ data }">
                                {{ data.createdBy?.fullName || '-' }}
                            </template>
                        </Column>

                        <Column header="Estado">
                            <template #body="{ data }">
                                <Tag :value="data.status" :severity="data.status === 'ACTIVE' ? 'success' : 'danger'" />
                            </template>
                        </Column>
                    </DataTable>

                    <!-- FOOTER -->

                    <div class="flex justify-between items-center mt-4 pt-3" style="border-top: 1px solid var(--surface-border)">
                        <span class="text-500">
                            Mostrando {{ cashRegister.movements.length }}
                            movimientos
                        </span>

                        <div class="flex gap-6">
                            <span>
                                <strong>Total Ingresos:</strong>

                                <span class="text-green-600 font-bold ml-2">Bs {{ totalIncome.toFixed(2) }}</span>
                            </span>

                            <span>
                                <strong>Total Egresos:</strong>

                                <span class="text-red-600 font-bold ml-2">Bs {{ totalExpense.toFixed(2) }}</span>
                            </span>

                            <span>
                                <strong>Saldo Neto:</strong>

                                <span class="font-bold ml-2">Bs {{ netAmount.toFixed(2) }}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <div v-else class="card text-center p-4">No se encontró la caja</div>
    </div>
</template>
