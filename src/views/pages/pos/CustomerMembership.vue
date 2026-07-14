<script setup>
import { formatDateTimeNoTZ2 } from '@/utils/date';
import { onMounted, ref } from 'vue';
import MembershipService from '../../../service/membership.service';

const data = ref([]);
const loading = ref(false);
const syncing = ref({});

async function load() {
    loading.value = true;
    try {
        data.value = await MembershipService.getAllStatus();
    } finally {
        loading.value = false;
    }
}

async function sync(customerId) {
    syncing.value[customerId] = true;

    try {
        await MembershipService.sync(customerId);

        console.log('Sync OK');
        // opcional: recargar tabla
        await load();
    } catch (error) {
        console.error('Error sync', error);
    } finally {
        syncing.value[customerId] = false;
    }
}

function getSeverity(row) {
    const today = new Date();
    const end = new Date(row.endDate);

    if (end < today) return 'danger';

    const diff = (end - today) / (1000 * 60 * 60 * 24);

    if (diff <= 5) return 'warning';

    return 'success';
}

onMounted(load);
</script>

<template>
    <div class="card">
        <h3>Estado de Membresías</h3>

        <DataTable :value="data" :loading="loading">
            <Column header="Cliente">
                <template #body="{ data }">
                    {{ data.customer?.name }}
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

            <Column header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="getSeverity(data)" />
                </template>
            </Column>
            <Column header="Acciones">
                <template #body="{ data }">
                    <Button icon="pi pi-sync" class="p-button-sm" :loading="syncing[data.customerId]" @click="sync(data.customerId)" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
