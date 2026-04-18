<script setup>
import { computed } from 'vue';

const props = defineProps({
    purchase: Object,
    companyName: String,
    branchName: String
});

function formatDate(date) {
    return new Date(date).toLocaleString();
}

const paymentMethods = computed(() => props.purchase.purchasePaymentMethods || []);

const totalPaid = computed(() => paymentMethods.value.reduce((sum, p) => sum + Number(p.amount || 0), 0));

const debt = computed(() => {
    return Number(props.purchase.total) - totalPaid.value;
});
</script>

<template>
    <div id="ticket">
        <div class="center">
            <h3>{{ companyName }}</h3>
            <p>{{ branchName }}</p>
            <p>--------------------------</p>
        </div>

        <div class="info">
            <p>Compra: {{ purchase.invoiceNumber || 'N/A' }}</p>
            <p>Fecha: {{ formatDate(purchase.printedAt) }}</p>
            <p>Cajero: {{ purchase.printedBy }}</p>
        </div>

        <p>--------------------------</p>

        <div class="items">
            <div class="row" v-for="item in purchase.items" :key="item.id">
                <span>{{ item.quantity }} x {{ item.product?.name || item.productId }}</span>
                <span>Bs {{ item.subtotal }}</span>
            </div>
        </div>

        <p>--------------------------</p>

        <div class="row total">
            <span>Total compranga:</span>
            <span>Bs {{ purchase.total }}</span>
        </div>

        <p>--------------------------</p>

        <!-- MÉTODOS DE PAGO -->
        <div class="payments">
            <div class="center">
                <strong>Formas de pago</strong>
            </div>

            <div class="row" v-for="pm in paymentMethods" :key="pm.id">
                <span>{{ pm.methodOption?.name || 'Método' }}</span>
                <span>Bs {{ pm.amount }}</span>
            </div>

            <p>--------------------------</p>

            <div class="row total">
                <span>Total pagado:</span>
                <span>Bs {{ totalPaid }}</span>
            </div>

            <div v-if="purchase.status === 'PARTIAL'" class="row debt">
                <span>Deuda:</span>
                <span>Bs {{ debt }}</span>
            </div>
        </div>

        <p>--------------------------</p>

        <div class="center">
            <p>Orden de Compra creada...</p>
        </div>
    </div>
</template>

<style scoped>
#ticket {
    width: 80mm;
    font-family: monospace;
    font-size: 12px;
    padding: 5mm;
}

.center {
    text-align: center;
}

.row {
    display: flex;
    justify-content: space-between;
}

.total {
    font-weight: bold;
}

.debt {
    font-weight: bold;
    color: #b00020;
}
</style>
