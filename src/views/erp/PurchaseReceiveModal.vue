<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';
import purchaseService from '../../service/purchase.service';

const props = defineProps({
    visible: Boolean,
    purchase: Object
});

const emit = defineEmits(['close', 'received']);

const toast = useToast();

const loading = ref(false);
const items = ref([]);

// ========================
// Cargar items cuando se abre
// ========================
watch(
    () => props.purchase,
    async (val) => {
        if (!val) return;

        try {
            const fullPurchase = await purchaseService.getById(val.id);

            items.value = fullPurchase.items.map((i) => ({
                purchaseItemId: i.id,
                productName: i.product?.name,
                ordered: i.quantity,
                received: i.quantityReceived,
                remaining: i.quantity - i.quantityReceived,
                toReceive: 0
            }));
        } catch (e) {
            console.error('Error loading purchase items', e);
        }
    },
    { immediate: true }
);

const totalToReceive = computed(() => items.value.reduce((sum, i) => sum + Number(i.toReceive || 0), 0));

// ========================
// Registrar recepción
// ========================
async function registerReceive() {
    const payload = items.value
        .filter((i) => i.toReceive > 0)
        .map((i) => ({
            purchaseItemId: i.purchaseItemId,
            quantityReceived: i.toReceive
        }));

    if (!payload.length) {
        toast.add({
            severity: 'warn',
            summary: 'Ingrese cantidades a recibir',
            life: 3000
        });
        return;
    }

    loading.value = true;

    try {
        await purchaseService.receivePurchase(props.purchase.id, {
            items: payload
        });

        toast.add({
            severity: 'success',
            summary: 'Recepción registrada',
            life: 3000
        });

        emit('received');
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'Error al recibir',
            life: 4000
        });
    } finally {
        loading.value = false;
    }
}

function closeModal() {
    emit('close');
}
</script>

<template>
    <Dialog :visible="visible" modal header="Recibir Mercadería" style="width: 700px" @hide="emit('close')">
        <div v-if="purchase">
            <div class="mb-3">
                <b>Compra #{{ purchase.id }}</b>
            </div>

            <DataTable :value="items">
                <Column header="Producto">
                    <template #body="{ data }">
                        {{ data.productName }}
                    </template>
                </Column>

                <Column header="Ordenado">
                    <template #body="{ data }">
                        {{ data.ordered }}
                    </template>
                </Column>

                <Column header="Recibido">
                    <template #body="{ data }">
                        {{ data.received }}
                    </template>
                </Column>

                <Column header="Pendiente">
                    <template #body="{ data }">
                        {{ data.remaining }}
                    </template>
                </Column>

                <Column header="Recibir ahora">
                    <template #body="{ data }">
                        <InputNumber v-model="data.toReceive" :max="data.remaining" :min="0" />
                    </template>
                </Column>
            </DataTable>

            <div class="mt-3 text-right font-bold">Total a recibir ahora: {{ totalToReceive }}</div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="closeModal" />

            <Button label="Registrar Recepción" severity="success" :loading="loading" @click="registerReceive" />
        </template>
    </Dialog>
</template>
