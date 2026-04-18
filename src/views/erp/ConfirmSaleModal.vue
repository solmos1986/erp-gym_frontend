<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import salesService from '../../service/sale.service';

const toast = useToast();

const props = defineProps({
    visible: Boolean,
    sale: Object
});

const emit = defineEmits(['close', 'confirmed']);

const paymentMethods = ref([]);
const payments = ref([]);

onMounted(async () => {
    try {
        paymentMethods.value = await salesService.getPaymentMethodOptions();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error cargando métodos de pago' });
    }
});

function addPayment() {
    payments.value.push({
        methodId: null,
        amount: 0
    });
}

function removePayment(index) {
    payments.value.splice(index, 1);
}

const totalPaid = computed(() => payments.value.reduce((sum, p) => sum + Number(p.amount || 0), 0));

const debt = computed(() => props.sale.total - totalPaid.value);

const statusPreview = computed(() => {
    if (totalPaid.value === 0) return 'PARTIAL (Crédito)';
    if (totalPaid.value < props.sale.total) return 'PARTIAL (Mixta)';
    return 'PAID (Contado)';
});
const isInvalidPayment = computed(() => totalPaid.value > props.sale.total);
async function confirm() {
    try {
        if (props.sale.status === 'DRAFT') {
            // Confirmación inicial
            await salesService.confirmSale(props.sale.id, {
                payments: payments.value
            });
        } else if (props.sale.status === 'PARTIAL') {
            // Pago adicional
            await salesService.paySale(props.sale.id, {
                payments: payments.value
            });
        }

        toast.add({
            severity: 'success',
            summary: 'Operación exitosa',
            detail: 'El pago se registró correctamente',
            life: 3000
        });

        emit('confirmed');
        emit('close');
    } catch (e) {
        console.error(e);

        const message = e.response?.data?.message || 'No se pudo registrar el pago. Verifique que tenga una caja abierta.';

        toast.add({
            severity: 'error',
            summary: 'Error al registrar el pago',
            detail: message,
            life: 5000
        });
    }
}

watch(
    () => props.visible,
    (v) => {
        if (v) payments.value = [];
    }
);
</script>

<template>
    <Dialog :visible="visible" modal header="Confirmar venta" style="width: 500px" @update:visible="emit('close')">
        <div class="mb-3"><b>Total venta:</b> Bs {{ sale.total }}</div>

        <div v-for="(p, i) in payments" :key="i" class="flex gap-2 mb-2">
            <Dropdown v-model="p.methodId" :options="paymentMethods" optionLabel="name" optionValue="id" placeholder="Método" class="w-1/2" />
            <InputNumber v-model="p.amount" placeholder="Monto" class="w-1/2" />
            <Button icon="pi pi-times" severity="danger" text @click="removePayment(i)" />
        </div>

        <Button label="Agregar método de pago" icon="pi pi-plus" text @click="addPayment" />

        <hr />

        <div class="flex justify-between">
            <span>Total pagado:</span>
            <b>Bs {{ totalPaid }}</b>
        </div>

        <div class="flex justify-between">
            <span>Deuda:</span>
            <b>Bs {{ debt }}</b>
        </div>
        <p v-if="payments.length === 0" class="text-gray-500 text-sm text-center mt-2">Si no agrega pagos, la venta quedará totalmente a crédito.</p>

        <p v-if="isInvalidPayment" class="text-red-500 text-sm text-center mt-2">El total pagado no puede ser mayor al total de la venta.</p>
        <div class="text-center mt-2">
            <Tag :value="statusPreview" :severity="statusPreview.includes('PAID') ? 'success' : 'warning'" />
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="emit('close')" />
            <Button label="Confirmar venta" severity="success" :disabled="isInvalidPayment" @click="confirm" />
        </template>
    </Dialog>
</template>
