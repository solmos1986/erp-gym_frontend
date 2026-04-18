<script setup>
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import { onMounted, ref } from 'vue';
import treasuryService from '../../service/treasury.service';

/**
 * Estados
 */
const loading = ref(false);
const error = ref(null);

const cashBoxes = ref([]);
const selectedCashBox = ref(null);

const dateFrom = ref(null);
const dateTo = ref(null);

const report = ref(null);

/**
 * Cargar cajas físicas (CashBox)
 */
const loadCashBoxes = async () => {
    try {
        cashBoxes.value = await treasuryService.getCashBoxes();
    } catch (e) {
        console.error(e);
        error.value = 'Error al cargar cajas';
    }
};

/**
 * Generar reporte
 */
const generateReport = async () => {
    if (!selectedCashBox.value || !dateFrom.value || !dateTo.value) {
        error.value = 'Debe seleccionar una caja y un rango de fechas';
        return;
    }

    loading.value = true;
    error.value = null;
    report.value = null;

    try {
        const data = await treasuryService.getCashReport({
            cashBoxId: selectedCashBox.value.id,
            dateFrom: dateFrom.value,
            dateTo: dateTo.value
        });
        report.value = data;
    } catch (e) {
        console.error(e);
        error.value = e.response?.data?.message || 'Error al generar reporte';
    } finally {
        loading.value = false;
    }
};

/**
 * Helpers
 */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2
    }).format(value || 0);
};

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString('es-BO');
};

onMounted(() => {
    loadCashBoxes();
});
const exportPDF = async () => {
    if (!selectedCashBox.value || !dateFrom.value || !dateTo.value) return;

    const params = {
        cashBoxId: selectedCashBox.value.id,
        dateFrom: dateFrom.value.toISOString().slice(0, 10),
        dateTo: dateTo.value.toISOString().slice(0, 10)
    };

    try {
        const response = await treasuryService.getCashReportPDF(params);

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Caja_${selectedCashBox.value.name}_${params.dateFrom}_${params.dateTo}.pdf`;
        link.click();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
    }
};
</script>

<template>
    <div class="grid grid-cols-12 gap-6">
        <!-- Filtros -->
        <div class="col-span-12">
            <Card>
                <template #title> Reporte de Caja por Período </template>
                <template #content>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-4">
                            <label class="block mb-1">Caja física</label>
                            <Dropdown v-model="selectedCashBox" :options="cashBoxes" optionLabel="name" placeholder="Seleccione una caja" class="w-full" />
                        </div>

                        <div class="col-span-12 md:col-span-3">
                            <label class="block mb-1">Desde</label>
                            <Calendar v-model="dateFrom" dateFormat="yy-mm-dd" class="w-full" showIcon />
                        </div>

                        <div class="col-span-12 md:col-span-3">
                            <label class="block mb-1">Hasta</label>
                            <Calendar v-model="dateTo" dateFormat="yy-mm-dd" class="w-full" showIcon />
                        </div>

                        <div class="col-span-12 md:col-span-2 flex items-end">
                            <Button label="Generar" icon="pi pi-search" class="w-full" :loading="loading" @click="generateReport" />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Error -->
        <div v-if="error" class="col-span-12">
            <Message severity="warn">{{ error }}</Message>
        </div>

        <!-- Resumen financiero -->
        <template v-if="report">
            <div class="col-span-12 grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-3">
                    <div class="kpi-card">
                        <span class="kpi-title">Saldo Inicial</span>
                        <span class="kpi-value">
                            {{ formatCurrency(report.summary.initialBalance) }}
                        </span>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-3">
                    <div class="kpi-card">
                        <span class="kpi-title">Total Ingresos</span>
                        <span class="kpi-value positive">
                            {{ formatCurrency(report.summary.totalIn) }}
                        </span>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-3">
                    <div class="kpi-card">
                        <span class="kpi-title">Total Egresos</span>
                        <span class="kpi-value negative">
                            {{ formatCurrency(report.summary.totalOut) }}
                        </span>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-3">
                    <div class="kpi-card">
                        <span class="kpi-title">Saldo Final</span>
                        <span class="kpi-value balance">
                            {{ formatCurrency(report.summary.finalBalance) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Información de contexto -->
            <div class="col-span-12">
                <Card>
                    <template #content>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-2 mt-2"><strong>Caja:</strong> {{ report.cashBox.name }}</div>

                            <div class="col-span-12 md:col-span-4 mt-2">
                                <strong>Período:</strong>
                                {{ formatDate(report.period.from) }} → {{ formatDate(report.period.to) }}
                            </div>
                            <div class="col-span-12 md:col-span-2 mt-2">
                                <strong>Sesiones consideradas:</strong>
                                {{ report.sessions.length }}
                            </div>
                            <div v-if="report" class="col-span-12 md:col-span-2"></div>
                            <div v-if="report" class="col-span-12 md:col-span-2 flex justify-end">
                                <Button label="Exportar PDF" icon="pi pi-file-pdf" class="p-button-danger" @click="exportPDF" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Detalle de movimientos -->
            <div class="col-span-12">
                <Card>
                    <template #title> Detalle de Movimientos </template>
                    <template #content>
                        <DataTable :value="report.movements" paginator :rows="15" stripedRows responsiveLayout="scroll">
                            <Column field="createdAt" header="Fecha">
                                <template #body="slotProps">
                                    {{ formatDate(slotProps.data.createdAt) }}
                                </template>
                            </Column>

                            <Column field="type" header="Tipo" />

                            <Column field="origin" header="Origen" />

                            <Column field="reference" header="Referencia" />

                            <Column header="Usuario">
                                <template #body="slotProps">
                                    {{ slotProps.data.user?.name || '---' }}
                                </template>
                            </Column>

                            <Column field="amount" header="Monto">
                                <template #body="slotProps">
                                    <span :class="slotProps.data.type === 'IN' ? 'positive' : 'negative'">
                                        {{ formatCurrency(slotProps.data.amount) }}
                                    </span>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </template>
    </div>
</template>

<style scoped>
.kpi-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    box-shadow: var(--card-shadow);
}

.kpi-title {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.kpi-value {
    font-size: 1.6rem;
    font-weight: 600;
}

.positive {
    color: #16a34a;
}

.negative {
    color: #dc2626;
}

.balance {
    color: #2563eb;
}
</style>
