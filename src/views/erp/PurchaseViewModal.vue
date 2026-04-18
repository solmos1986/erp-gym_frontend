<script setup>
import { computed } from 'vue';

const props = defineProps({
    visible: Boolean,
    purchase: Object
});

const emit = defineEmits(['close']);

const totalPaid = computed(() => {
    if (!props.purchase?.purchasepaymentMethods) return 0;
    return props.purchase.purchasepaymentMethods.reduce((s, p) => s + Number(p.amount), 0);
});

const remaining = computed(() => {
    if (!props.purchase) return 0;
    return props.purchase.total - totalPaid.value;
});

function statusSeverity(status) {
    switch (status) {
        case 'DRAFT':
            return 'warning';
        case 'CONFIRMED':
            return 'info';
        case 'CANCELLED':
            return 'danger';
        default:
            return 'secondary';
    }
}

function paymentSeverity(status) {
    switch (status) {
        case 'PAID':
            return 'success';
        case 'PARTIAL':
            return 'warning';
        case 'CREDIT':
            return 'secondary';
        default:
            return 'secondary';
    }
}

function receiveSeverity(status) {
    switch (status) {
        case 'RECEIVED':
            return 'success';
        case 'PARTIAL':
            return 'warning';
        case 'PENDING':
            return 'secondary';
        default:
            return 'secondary';
    }
}
</script>

<template>
    <Dialog :visible="visible" modal header="Detalle de Compra" style="width: 800px" @update:visible="emit('close')">
        <div v-if="purchase">
            <!-- CABECERA -->
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div><b>Proveedor:</b> {{ purchase.partner?.name }}</div>
                    <div><b>Usuario:</b> {{ purchase.user?.name }}</div>
                    <div>
                        <b>Fecha:</b>
                        {{ purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleString() : new Date(purchase.createdAt).toLocaleString() }}
                    </div>
                </div>

                <div>
                    <div>
                        <Tag :value="purchase.status" :severity="statusSeverity(purchase.status)" />
                    </div>
                    <div class="mt-1">
                        <Tag :value="purchase.paymentStatus" :severity="paymentSeverity(purchase.paymentStatus)" />
                    </div>
                    <div class="mt-1">
                        <Tag :value="purchase.receiveStatus" :severity="receiveSeverity(purchase.receiveStatus)" />
                    </div>
                </div>
            </div>

            <!-- ITEMS -->
            <h4 class="mb-2">Productos</h4>
            <DataTable :value="purchase.items" responsiveLayout="scroll" class="mb-4">
                <Column header="Producto">
                    <template #body="{ data }">
                        {{ data.product?.name || data.productId }}
                    </template>
                </Column>

                <Column header="Cantidad">
                    <template #body="{ data }">
                        {{ data.quantity }}
                    </template>
                </Column>

                <Column header="Recibido">
                    <template #body="{ data }">
                        {{ data.quantityReceived }}
                    </template>
                </Column>

                <Column header="Pendiente">
                    <template #body="{ data }">
                        {{ data.quantity - data.quantityReceived }}
                    </template>
                </Column>

                <Column header="Precio">
                    <template #body="{ data }"> Bs {{ data.price }} </template>
                </Column>

                <Column header="Subtotal">
                    <template #body="{ data }"> Bs {{ data.subtotal }} </template>
                </Column>
            </DataTable>

            <!-- PAGOS -->
            <h4 class="mb-2">Pagos registrados</h4>

            <DataTable v-if="purchase.purchasepaymentMethods?.length" :value="purchase.purchasepaymentMethods" responsiveLayout="scroll" class="mb-3">
                <Column header="Método">
                    <template #body="{ data }">
                        {{ data.methodOption?.name }}
                    </template>
                </Column>

                <Column header="Cuenta">
                    <template #body="{ data }">
                        {{ data.financialAccount?.name }}
                    </template>
                </Column>

                <Column header="Monto">
                    <template #body="{ data }"> Bs {{ data.amount }} </template>
                </Column>

                <Column header="Fecha">
                    <template #body="{ data }">
                        {{ new Date(data.createdAt).toLocaleString() }}
                    </template>
                </Column>
            </DataTable>

            <div v-else class="text-gray-400 italic mb-3">No hay pagos registrados</div>

            <!-- RESUMEN -->
            <div class="border-t pt-3 text-right">
                <div><b>Total:</b> Bs {{ purchase.total }}</div>
                <div><b>Pagado:</b> Bs {{ totalPaid }}</div>
                <div class="font-bold"><b>Saldo:</b> Bs {{ remaining }}</div>
            </div>
        </div>

        <template #footer>
            <Button label="Cerrar" severity="secondary" @click="emit('close')" />
        </template>
    </Dialog>
</template>
