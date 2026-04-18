<script setup>
import { computed } from 'vue';

const props = defineProps({
    sale: Object,
    companyName: String,
    branchName: String
});

function formatDate(date) {
    return new Date(date).toLocaleString();
}

const paymentMethods = computed(() => props.sale.paymentMethods || []);

const totalPaid = computed(() => paymentMethods.value.reduce((sum, p) => sum + Number(p.amount || 0), 0));

const debt = computed(() => {
    return Number(props.sale.total) - totalPaid.value;
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
            <p>Ticket: {{ sale.ticketNumber }}</p>
            <p>Cliente: {{ sale.customer?.name || 'N/A' }}</p>
            <p>Fecha: {{ formatDate(sale.printedAt) }}</p>
            <p>Cajero: {{ sale.printedBy }}</p>
        </div>

        <p>--------------------------</p>

        <div class="items">
            <div class="row" v-for="item in sale.items" :key="item.id">
                <span>{{ item.quantity }} x {{ item.product?.name || item.productId }}</span>
                <span>Bs {{ item.subtotal }}</span>
            </div>
        </div>

        <p>--------------------------</p>

        <div class="row total">
            <span>Total:</span>
            <span>Bs {{ sale.total }}</span>
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

            <div v-if="sale.status === 'PARTIAL'" class="row debt">
                <span>Deuda:</span>
                <span>Bs {{ debt }}</span>
            </div>
        </div>

        <p>--------------------------</p>

        <div class="center">
            <p>Gracias por su compra</p>
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
