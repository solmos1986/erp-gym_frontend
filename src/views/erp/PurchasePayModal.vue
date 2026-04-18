<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import purchaseService from '../../service/purchase.service';

const props = defineProps({
    visible: Boolean,
    purchase: Object
});

const emit = defineEmits(['close', 'paid']);

const toast = useToast();

const paymentMethods = ref([]);
const financialAccounts = ref([]);
const payments = ref([]);
const loading = ref(false);

const totalNow = computed(() => payments.value.reduce((s, p) => s + Number(p.amount || 0), 0));

onMounted(async () => {
    paymentMethods.value = await purchaseService.getPaymentMethodOptions();
    financialAccounts.value = await purchaseService.getFinancialAccounts();
});

async function registerPayment() {
    if (!payments.value.length) {
        toast.add({
            severity: 'warn',
            summary: 'Agregue al menos un pago',
            life: 3000
        });
        return;
    }

    loading.value = true;

    try {
        await purchaseService.payPurchase(props.purchase.id, {
            payments: payments.value
        });

        toast.add({
            severity: 'success',
            summary: 'Pago registrado correctamente',
            life: 3000
        });

        emit('paid');
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'Error al registrar pago',
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
    <Dialog :visible="visible" modal header="Registrar Pago" style="width: 600px" @hide="emit('close')">
        <div v-if="purchase">
            <div class="mb-2"><b>Total compra:</b> Bs {{ purchase.total }}</div>

            <div v-for="(p, i) in payments" :key="i" class="flex gap-2 mb-2">
                <Dropdown v-model="p.methodOptionId" :options="paymentMethods" optionLabel="name" optionValue="id" placeholder="Método" />

                <Dropdown v-model="p.financialAccountId" :options="financialAccounts" optionLabel="name" optionValue="id" placeholder="Cuenta" />

                <InputNumber v-model="p.amount" placeholder="Monto" />

                <Button icon="pi pi-trash" severity="danger" text @click="payments.splice(i, 1)" />
            </div>

            <Button
                icon="pi pi-plus"
                label="Agregar pago"
                @click="
                    payments.push({
                        methodOptionId: null,
                        financialAccountId: null,
                        amount: 0
                    })
                "
            />

            <div class="mt-3 font-bold">Total pago ahora: Bs {{ totalNow }}</div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="closeModal" />

            <Button label="Registrar Pago" severity="success" :loading="loading" @click="registerPayment" />
        </template>
    </Dialog>
</template>
