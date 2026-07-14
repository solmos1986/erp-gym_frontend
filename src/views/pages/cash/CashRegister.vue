<script setup>
import CashMovementService from '@/service/cashMovement.service';
import CashRegisterService from '@/service/cashRegister.service';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();

const loading = ref(false);

const cashRegister = ref(null);

const openDialog = ref(false);
const closeDialog = ref(false);

const openForm = ref({
    openingAmount: 0,
    notes: ''
});

const closeForm = ref({
    countedAmount: 0,
    notes: ''
});
const closingDifference = computed(() => {
    const expected = Number(summary.value?.expectedAmount || 0);

    const counted = Number(closeForm.value.countedAmount || 0);

    return counted - expected;
});

const summary = ref(null);
const movements = ref([]);

const incomeDialog = ref(false);
const expenseDialog = ref(false);

const incomeForm = ref({
    description: '',
    amount: 0,
    method: 'CASH'
});

const expenseForm = ref({
    description: '',
    amount: 0,
    method: 'CASH'
});
const paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'QR', value: 'QR' },
    { label: 'Tarjeta', value: 'CARD' },
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Depósito', value: 'DEPOSIT' }
];

async function loadCashRegister() {
    loading.value = true;

    try {
        cashRegister.value = await CashRegisterService.getCurrent();

        movements.value = cashRegister.value?.movements || [];

        await loadSummary();
    } catch (error) {
        if (error?.response?.status === 404) {
            cashRegister.value = null;
            movements.value = [];
            summary.value = null;

            return;
        }

        console.error(error);
    } finally {
        loading.value = false;
    }
}

async function createIncome() {
    try {
        await CashMovementService.create({
            type: 'INCOME',

            amount: Number(incomeForm.value.amount),

            description: incomeForm.value.description,

            payments: [
                {
                    method: incomeForm.value.method,

                    amount: Number(incomeForm.value.amount)
                }
            ]
        });

        toast.add({
            severity: 'success',
            summary: 'Ingreso registrado',
            life: 3000
        });

        incomeDialog.value = false;

        incomeForm.value = {
            description: '',
            amount: 0,
            method: 'CASH'
        };

        await loadSummary();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error registrando ingreso',
            life: 3000
        });
    }
}

async function createExpense() {
    try {
        await CashMovementService.create({
            type: 'EXPENSE',

            amount: Number(expenseForm.value.amount),

            description: expenseForm.value.description,

            payments: [
                {
                    method: expenseForm.value.method,

                    amount: Number(expenseForm.value.amount)
                }
            ]
        });

        toast.add({
            severity: 'success',
            summary: 'Egreso registrado',
            life: 3000
        });

        expenseDialog.value = false;

        expenseForm.value = {
            description: '',
            amount: 0,
            method: 'CASH'
        };

        await loadSummary();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error registrando egreso',
            life: 3000
        });
    }
}

async function cancelMovement(id) {
    try {
        await CashMovementService.cancel(id);

        toast.add({
            severity: 'success',
            summary: 'Movimiento anulado',
            life: 3000
        });

        await loadSummary();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error anulando movimiento',
            life: 3000
        });
    }
}

async function openCashRegister() {
    if (!openForm.value.openingAmount && openForm.value.openingAmount !== 0) {
        toast.add({
            severity: 'warn',
            summary: 'Ingrese el monto inicial',
            life: 3000
        });

        return;
    }

    try {
        await CashRegisterService.open(openForm.value);

        toast.add({
            severity: 'success',
            summary: 'Caja abierta correctamente',
            life: 3000
        });

        openDialog.value = false;

        openForm.value = {
            openingAmount: 0,
            notes: ''
        };

        await loadCashRegister();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error abriendo caja',
            life: 3000
        });
    }
}

function getPaymentMethodLabel(method) {
    const labels = {
        CASH: 'Efectivo',
        QR: 'QR',
        CARD: 'Tarjeta',
        TRANSFER: 'Transferencia',
        DEPOSIT: 'Depósito'
    };

    return labels[method] || method;
}

async function closeCashRegister() {
    try {
        await CashRegisterService.close(cashRegister.value.id, {
            countedAmount: Number(closeForm.value.countedAmount),

            notes: closeForm.value.notes
        });

        toast.add({
            severity: 'success',
            summary: 'Caja cerrada',
            life: 3000
        });

        closeDialog.value = false;

        await loadCashRegister();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error cerrando caja',
            life: 3000
        });
    }
}

async function loadSummary() {
    try {
        summary.value = await CashRegisterService.getSummary();
        console.log('Resumen de caja:', summary.value);
    } catch (error) {
        summary.value = null;
    }
}

onMounted(async () => {
    await loadCashRegister();
});
</script>

<template>
    <div v-if="!cashRegister">
        <Card>
            <template #content>
                <div class="text-center py-8">
                    <i class="pi pi-lock-open text-5xl text-primary mb-4" />

                    <h3 class="text-xl font-semibold mb-2">No existe una caja abierta</h3>

                    <p class="text-surface-500 mb-4">Abra una nueva caja para comenzar a registrar movimientos.</p>

                    <Button label="Abrir Caja" icon="pi pi-plus" severity="success" @click="openDialog = true" />
                </div>
            </template>
        </Card>
        <Dialog v-model:visible="openDialog" header="Abrir Caja" modal :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block mb-2 font-medium">Monto Inicial</label>

                    <InputNumber v-model="openForm.openingAmount" mode="decimal" :min="0" fluid />
                </div>

                <div>
                    <label class="block mb-2 font-medium">Observaciones</label>

                    <Textarea v-model="openForm.notes" rows="3" fluid placeholder="Ej: Apertura turno mañana" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="openDialog = false" />

                <Button label="Abrir Caja" icon="pi pi-lock-open" severity="success" @click="openCashRegister" />
            </template>
        </Dialog>
    </div>

    <div v-else>
        <div>
            <Message severity="success" class="mb-4">
                <div class="flex align-items-center gap-2">
                    <i class="pi pi-check-circle text-xl"></i>

                    <span class="font-semibold">Caja abierta</span>
                </div>
            </Message>
            <Card class="mb-4">
                <template #content>
                    <div class="grid grid-cols-12 gap-4">
                        <!-- Usuario -->

                        <div class="col-span-12 md:col-span-6 xl:col-span-3">
                            <div class="flex align-items-center gap-3">
                                <div class="flex items-center justify-center bg-purple-100 rounded-border" style="width: 3rem; height: 3rem">
                                    <i class="pi pi-user text-purple-500 text-xl"></i>
                                </div>

                                <div>
                                    <div class="text-muted-color">Usuario</div>

                                    <div class="font-semibold text-xl">
                                        {{ cashRegister?.openedBy?.fullName }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sucursal -->

                        <div class="col-span-12 md:col-span-6 xl:col-span-3">
                            <div class="flex align-items-center gap-3">
                                <div class="flex items-center justify-center bg-blue-100 rounded-border" style="width: 3rem; height: 3rem">
                                    <i class="pi pi-building text-blue-500 text-xl"></i>
                                </div>

                                <div>
                                    <div class="text-muted-color">Sucursal</div>

                                    <div class="font-semibold text-xl">
                                        {{ cashRegister?.branch?.name }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Apertura -->

                        <div class="col-span-12 md:col-span-6 xl:col-span-3">
                            <div class="flex align-items-center gap-3">
                                <div class="flex items-center justify-center bg-green-100 rounded-border" style="width: 3rem; height: 3rem">
                                    <i class="pi pi-dollar text-green-500 text-xl"></i>
                                </div>

                                <div>
                                    <div class="text-muted-color">Apertura</div>

                                    <div class="font-semibold text-xl">Bs {{ cashRegister?.openingAmount || 0 }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Estado -->

                        <div class="col-span-12 md:col-span-6 xl:col-span-3">
                            <div class="flex align-items-center gap-3">
                                <div class="flex items-center justify-center bg-green-100 rounded-border" style="width: 3rem; height: 3rem">
                                    <i class="pi pi-check-circle text-green-500 text-xl"></i>
                                </div>

                                <div>
                                    <div class="text-muted-color">Estado</div>

                                    <Tag value="ABIERTA" severity="success" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
            <!-- RESUMEN DE CAJA -->

            <div v-if="summary" class="grid grid-cols-12 gap-4 mt-4">
                <!-- APERTURA -->

                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <Card class="mb-0">
                        <template #content>
                            <div class="flex align-items-center gap-8">
                                <div class="flex items-center justify-center bg-purple-100 rounded-border" style="width: 4rem; height: 4rem">
                                    <i class="pi pi-wallet text-purple-500 text-xl"></i>
                                </div>

                                <div>
                                    <div class="block text-muted-color font-medium mb-3">Apertura</div>

                                    <div class="text-surface-900 font-medium text-2xl">Bs {{ summary?.openingAmount || 0 }}</div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- INGRESOS -->
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <Card class="mb-0">
                        <template #content>
                            <div class="flex align-items-center gap-8">
                                <div class="flex items-center justify-center bg-green-100 rounded-border" style="width: 4rem; height: 4rem">
                                    <i class="pi pi-arrow-up-right text-green-500 text-xl"></i>
                                </div>

                                <div>
                                    <div class="block text-muted-color font-medium mb-3">Ingresos</div>

                                    <div class="text-green-500 font-medium text-2xl">Bs {{ summary?.income || 0 }}</div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- EGRESOS -->

                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <Card class="mb-0">
                        <template #content>
                            <div class="flex align-items-center gap-8">
                                <div class="flex items-center justify-center bg-red-100 rounded-border" style="width: 4rem; height: 4rem">
                                    <i class="pi pi-arrow-down-right text-red-500 text-xl"></i>
                                </div>

                                <div>
                                    <div class="block text-muted-color font-medium mb-3">Egresos</div>

                                    <div class="text-red-500 font-medium text-2xl">Bs {{ summary?.expense || 0 }}</div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- ESPERADO -->

                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <Card class="mb-0">
                        <template #content>
                            <div class="flex align-items-center gap-8">
                                <div class="flex items-center justify-center bg-blue-100 rounded-border" style="width: 4rem; height: 4rem">
                                    <i class="pi pi-calculator text-blue-500 text-xl"></i>
                                </div>

                                <div>
                                    <div class="block text-muted-color font-medium mb-3">Esperado</div>

                                    <div class="text-primary font-medium text-2xl">Bs {{ summary?.expectedAmount || 0 }}</div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
            <!-- DETALLE POR METODO DE PAGO -->
            <div v-if="summary" class="grid grid-cols-12 gap-4 mt-4">
                <div class="col-span-12 xl:col-span-3">
                    <Card class="mb-0">
                        <template #content>
                            <h5 class="mb-4">Métodos de Pago</h5>

                            <!-- EFECTIVO -->

                            <div class="flex justify-between align-items-center pb-3 mb-3" style="border-bottom: 1px solid var(--surface-border)">
                                <div class="flex align-items-center gap-3">
                                    <div class="flex items-center justify-center bg-green-100 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-money-bill text-green-500"></i>
                                    </div>

                                    <span class="mt-2">Efectivo</span>
                                </div>

                                <strong class="mt-2">Bs {{ summary?.byMethod?.CASH || 0 }}</strong>
                            </div>

                            <!-- QR -->

                            <div class="flex justify-between align-items-center pb-3 mb-3" style="border-bottom: 1px solid var(--surface-border)">
                                <div class="flex align-items-center gap-3">
                                    <div class="flex items-center justify-center bg-purple-100 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-qrcode text-purple-500"></i>
                                    </div>

                                    <span class="mt-2">QR</span>
                                </div>

                                <strong class="mt-2">Bs {{ summary?.byMethod?.QR || 0 }}</strong>
                            </div>

                            <!-- TARJETA -->

                            <div class="flex justify-between align-items-center pb-3 mb-3" style="border-bottom: 1px solid var(--surface-border)">
                                <div class="flex align-items-center gap-3">
                                    <div class="flex items-center justify-center bg-blue-100 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-credit-card text-blue-500"></i>
                                    </div>

                                    <span class="mt-2">Tarjeta</span>
                                </div>

                                <strong class="mt-2">Bs {{ summary?.byMethod?.CARD || 0 }}</strong>
                            </div>

                            <!-- TRANSFERENCIA -->

                            <div class="flex justify-between align-items-center pb-3 mb-3" style="border-bottom: 1px solid var(--surface-border)">
                                <div class="flex align-items-center gap-3">
                                    <div class="flex items-center justify-center bg-orange-100 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-arrow-right-arrow-left text-orange-500"></i>
                                    </div>

                                    <span class="mt-2">Transferencia</span>
                                </div>

                                <strong class="mt-2">Bs {{ summary?.byMethod?.TRANSFER || 0 }}</strong>
                            </div>

                            <!-- DEPÓSITO -->

                            <div class="flex justify-between align-items-center">
                                <div class="flex align-items-center gap-3">
                                    <div class="flex items-center justify-center bg-cyan-100 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                        <i class="pi pi-building-columns text-cyan-500"></i>
                                    </div>

                                    <span class="mt-2">Depósito</span>
                                </div>

                                <strong class="mt-2">Bs {{ summary?.byMethod?.DEPOSIT || 0 }}</strong>
                            </div>
                        </template>
                    </Card>
                </div>
                <!-- ACCIONES -->
                <div class="col-span-12 xl:col-span-9">
                    <Card class="mt-4">
                        <template #content>
                            <h5 class="mb-4">Acciones</h5>

                            <div class="grid grid-cols-12 gap-3">
                                <div class="col-span-12 md:col-span-4">
                                    <Button label="Nuevo Ingreso" icon="pi pi-plus" severity="success" size="large" class="w-full" @click="incomeDialog = true" />
                                </div>

                                <div class="col-span-12 md:col-span-4">
                                    <Button label="Nuevo Egreso" icon="pi pi-minus" severity="warn" size="large" class="w-full" @click="expenseDialog = true" />
                                </div>

                                <div class="col-span-12 md:col-span-4">
                                    <Button label="Cerrar Caja" icon="pi pi-lock" severity="danger" size="large" class="w-full" @click="closeDialog = true" />
                                </div>
                            </div>
                        </template>
                    </Card>
                    <Card class="mt-4">
                        <template #content>
                            <div class="flex justify-between align-items-center mb-4">
                                <h5 class="m-0">Movimientos de Caja</h5>

                                <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined />
                            </div>

                            <DataTable :value="movements" sort-field="createdAt" :sort-order="-1">
                                <Column header="Fecha">
                                    <template #body="{ data }">
                                        {{ new Date(data.createdAt).toLocaleString() }}
                                    </template>
                                </Column>

                                <Column header="Tipo">
                                    <template #body="{ data }">
                                        <Tag :severity="data.type === 'INCOME' ? 'success' : 'warn'">
                                            <i :class="data.type === 'INCOME' ? 'pi pi-arrow-up mr-1' : 'pi pi-arrow-down mr-1'" />

                                            {{ data.type === 'INCOME' ? 'Ingreso' : 'Egreso' }}
                                        </Tag>
                                    </template>
                                </Column>
                                <Column header="Origen">
                                    <template #body="{ data }">
                                        <Tag :value="data.referenceType" severity="info" />
                                    </template>
                                </Column>
                                <Column header="Descripción">
                                    <template #body="{ data }">
                                        {{ data.description || '-' }}
                                    </template>
                                </Column>

                                <Column header="Método">
                                    <template #body="{ data }">
                                        <div class="flex flex-wrap gap-1">
                                            <Tag v-for="payment in data.payments" :key="payment.id" :value="getPaymentMethodLabel(payment.method)" severity="secondary" />
                                        </div>
                                    </template>
                                </Column>

                                <Column header="Monto">
                                    <template #body="{ data }">Bs {{ data.amount }}</template>
                                </Column>

                                <Column header="Usuario">
                                    <template #body="{ data }">
                                        {{ data.createdBy?.fullName }}
                                    </template>
                                </Column>

                                <Column header="Estado">
                                    <template #body="{ data }">
                                        <Tag :value="data.status" :severity="data.status === 'ACTIVE' ? 'success' : 'danger'" />
                                    </template>
                                </Column>

                                <Column header="Acciones">
                                    <template #body="{ data }">
                                        <Button v-if="data.status === 'ACTIVE'" icon="pi pi-times" severity="danger" text rounded @click="cancelMovement(data.id)" />
                                    </template>
                                </Column>
                            </DataTable>
                        </template>
                    </Card>
                </div>
            </div>
        </div>
        <Dialog v-model:visible="incomeDialog" header="Nuevo Ingreso" modal :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block mb-2">Descripción</label>

                    <InputText v-model="incomeForm.description" class="w-full" />
                </div>

                <div>
                    <label class="block mb-2">Monto</label>

                    <InputNumber v-model="incomeForm.amount" mode="decimal" :min="0" class="w-full" />
                </div>

                <div>
                    <label class="block mb-2">Método de Pago</label>

                    <Select v-model="incomeForm.method" :options="paymentMethods" option-label="label" option-value="value" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="incomeDialog = false" />

                <Button label="Guardar" icon="pi pi-check" @click="createIncome" />
            </template>
        </Dialog>
        <Dialog v-model:visible="expenseDialog" header="Nuevo Egreso" modal :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block mb-2">Descripción</label>

                    <InputText v-model="expenseForm.description" class="w-full" />
                </div>

                <div>
                    <label class="block mb-2">Monto</label>

                    <InputNumber v-model="expenseForm.amount" mode="decimal" :min="0" class="w-full" />
                </div>

                <div>
                    <label class="block mb-2">Método de Pago</label>

                    <Select v-model="expenseForm.method" :options="paymentMethods" option-label="label" option-value="value" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="expenseDialog = false" />

                <Button label="Guardar" icon="pi pi-check" severity="warn" @click="createExpense" />
            </template>
        </Dialog>
        <Dialog v-model:visible="closeDialog" header="Cerrar Caja" modal :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="font-semibold">Monto Esperado</label>

                    <div class="text-xl mt-2">Bs {{ summary?.expectedAmount || 0 }}</div>
                </div>

                <div>
                    <label class="block mb-2">Monto Contado</label>

                    <InputNumber v-model="closeForm.countedAmount" mode="decimal" :min="0" class="w-full" />
                </div>

                <div>
                    <label class="font-semibold">Diferencia</label>

                    <div
                        class="text-xl mt-2"
                        :class="{
                            'text-green-500': closingDifference === 0,

                            'text-blue-500': closingDifference > 0,

                            'text-red-500': closingDifference < 0
                        }"
                    >
                        Bs {{ closingDifference }}
                    </div>
                </div>

                <div>
                    <label class="block mb-2">Observaciones</label>

                    <Textarea v-model="closeForm.notes" rows="3" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="closeDialog = false" />

                <Button label="Cerrar Caja" icon="pi pi-lock" severity="danger" @click="closeCashRegister" />
            </template>
        </Dialog>
    </div>
</template>
