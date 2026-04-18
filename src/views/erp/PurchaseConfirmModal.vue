<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';
import purchaseService from '../../service/purchase.service';

const props = defineProps({
    visible: Boolean,
    purchase: Object
});

const emit = defineEmits(['close', 'confirmed']);

const toast = useToast();

const loading = ref(false);
const paymentMethods = ref([]);
const financialAccounts = ref([]);

const isCredit = ref(false);
const payments = ref([]);

const totalPaid = computed(() => payments.value.reduce((s, p) => s + Number(p.amount || 0), 0));

const remaining = computed(() => (props.purchase ? props.purchase.total - totalPaid.value : 0));

watch(
    () => props.visible,
    async (val) => {
        if (val) {
            payments.value = [];
            isCredit.value = false;

            paymentMethods.value = await purchaseService.getPaymentMethodOptions();
            financialAccounts.value = await purchaseService.getFinancialAccounts();
        }
    }
);

function addPaymentRow() {
    payments.value.push({
        methodOptionId: null,
        financialAccountId: null,
        amount: 0
    });
}

function removePayment(index) {
    payments.value.splice(index, 1);
}

async function confirmPurchase() {
    if (!props.purchase) return;

    if (!isCredit.value && payments.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Debe registrar un pago o marcar como crédito',
            life: 3000
        });
        return;
    }

    if (!isCredit.value && remaining.value < 0) {
        toast.add({
            severity: 'error',
            summary: 'El pago excede el total',
            life: 3000
        });
        return;
    }

    loading.value = true;

    try {
        await purchaseService.confirmPurchase(props.purchase.id, {
            payments: isCredit.value ? [] : payments.value
        });

        toast.add({
            severity: 'success',
            summary: 'Compra confirmada',
            life: 3000
        });

        emit('confirmed');
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'Error al confirmar compra',
            life: 4000
        });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <Dialog :visible="visible" modal header="Confirmar Compra" style="width: 600px" @update:visible="emit('close')">
        <div v-if="purchase">
            <div class="mb-3">
                <div><b>Proveedor:</b> {{ purchase.partner?.name }}</div>
                <div class="text-lg font-bold">Total: Bs {{ purchase.total }}</div>
            </div>

            <div class="flex items-center gap-2 mb-3">
                <Checkbox v-model="isCredit" binary />
                <label>Compra a crédito</label>
            </div>

            <div v-if="!isCredit">
                <div v-for="(p, i) in payments" :key="i" class="grid grid-cols-3 gap-2 mb-2">
                    <Dropdown v-model="p.methodOptionId" :options="paymentMethods" optionLabel="name" optionValue="id" placeholder="Método" />

                    <Dropdown v-model="p.financialAccountId" :options="financialAccounts" optionLabel="name" optionValue="id" placeholder="Cuenta" />

                    <div class="flex gap-2">
                        <InputNumber v-model="p.amount" placeholder="Monto" class="w-full" />
                        <Button icon="pi pi-trash" severity="danger" text @click="removePayment(i)" />
                    </div>
                </div>

                <Button icon="pi pi-plus" label="Agregar pago" @click="addPaymentRow" class="mb-3" />
            </div>

            <div class="border-t pt-2">
                <div>Pagado: Bs {{ totalPaid }}</div>
                <div class="font-bold">Saldo restante: Bs {{ remaining }}</div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="emit('close')" />
            <Button label="Confirmar" severity="success" :loading="loading" @click="confirmPurchase" />
        </template>
    </Dialog>
</template>
