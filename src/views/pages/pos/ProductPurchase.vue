<script setup>
import ProductService from '@/modules/products/services/product.service';
import PartnerService from '@/service/partner.service';
import PurchaseService from '@/service/productPurchase.service';

import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';

import { computed, onMounted, ref } from 'vue';

const toast = useToast();

// =========================
// STATE
// =========================

const loading = ref(false);
const purchaseLoading = ref(false);

const purchases = ref([]);

const products = ref([]);
const suppliers = ref([]);

const dialogVisible = ref(false);

const detailDialog = ref(false);
const selectedPurchase = ref(null);
const detailLoading = ref(false);

// =========================
// PROVEEDORES
// =========================

const selectedSupplier = ref(null);
const filteredSuppliers = ref([]);

// =========================
// PRODUCTOS
// =========================

const selectedProduct = ref(null);
const filteredProducts = ref([]);

const cartItems = ref([]);

// =========================
// PAGOS
// =========================

const paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'QR', value: 'QR' },
    { label: 'Tarjeta', value: 'CARD' },
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Depósito', value: 'DEPOSIT' }
];

const form = ref({
    paymentMethod: 'CASH'
});

// =========================
// COMPUTED
// =========================

const total = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + Number(item.unitCost || 0) * Number(item.quantity || 0), 0);
});

// =========================
// LOADERS
// =========================

async function loadPurchases() {
    loading.value = true;

    try {
        purchases.value = await PurchaseService.getAll();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando compras',
            detail: error?.response?.data?.message || error.message,
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

async function loadProducts() {
    try {
        products.value = await ProductService.getAll({
            Active: true
        });
    } catch (error) {
        console.error(error);
    }
}

async function loadSuppliers() {
    try {
        suppliers.value = await PartnerService.getAll({
            type: 'SUPPLIER'
        });
    } catch (error) {
        console.error(error);
    }
}

// =========================
// AUTOCOMPLETE PROVEEDORES
// =========================

function searchSuppliers(event) {
    const query = event.query.toLowerCase();

    filteredSuppliers.value = suppliers.value.filter((supplier) => supplier.name.toLowerCase().includes(query));
}

// =========================
// AUTOCOMPLETE PRODUCTOS
// =========================

function searchProducts(event) {
    const query = event.query.toLowerCase();

    filteredProducts.value = products.value.filter((product) => product.name.toLowerCase().includes(query));
}

// =========================
// CARRITO
// =========================

function addProduct() {
    if (!selectedProduct.value) return;

    const existing = cartItems.value.find((item) => item.id === selectedProduct.value.id);

    if (existing) {
        existing.quantity++;
    } else {
        cartItems.value.push({
            ...selectedProduct.value,

            quantity: 1,

            unitCost: Number(selectedProduct.value.costPrice || 0)
        });
    }

    selectedProduct.value = null;
}

function removeProduct(productId) {
    cartItems.value = cartItems.value.filter((item) => item.id !== productId);
}

// =========================
// CREAR COMPRA
// =========================

async function createPurchase() {
    if (!selectedSupplier.value) {
        toast.add({
            severity: 'warn',
            summary: 'Seleccione un proveedor',
            life: 3000
        });

        return;
    }

    if (cartItems.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Debe agregar al menos un producto',
            life: 3000
        });

        return;
    }

    purchaseLoading.value = true;

    try {
        await PurchaseService.create({
            supplierId: selectedSupplier.value.id,

            items: cartItems.value.map((item) => ({
                productId: item.id,

                quantity: Number(item.quantity),

                unitCost: Number(item.unitCost)
            })),

            payments: [
                {
                    method: form.value.paymentMethod,

                    amount: Number(total.value)
                }
            ]
        });

        toast.add({
            severity: 'success',
            summary: 'Compra registrada correctamente',
            life: 3000
        });

        dialogVisible.value = false;

        await loadPurchases();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error registrando compra',
            life: 3000
        });
    } finally {
        purchaseLoading.value = false;
    }
}

// =========================
// DETALLE
// =========================

async function viewPurchase(purchase) {
    detailLoading.value = true;

    try {
        selectedPurchase.value = await PurchaseService.getById(purchase.id);

        detailDialog.value = true;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando detalle',
            detail: error?.response?.data?.message || error.message,
            life: 3000
        });
    } finally {
        detailLoading.value = false;
    }
}

// =========================
// ANULAR
// =========================

async function cancelPurchase(purchase) {
    try {
        await PurchaseService.cancel(purchase.id);

        toast.add({
            severity: 'success',
            summary: 'Compra anulada correctamente',
            life: 3000
        });

        await loadPurchases();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || error.message,
            life: 5000
        });
    }
}

// =========================
// DIALOG
// =========================

function openCreate() {
    form.value = {
        paymentMethod: 'CASH'
    };

    selectedSupplier.value = null;
    selectedProduct.value = null;

    cartItems.value = [];

    dialogVisible.value = true;
}

// =========================
// INIT
// =========================

onMounted(async () => {
    await Promise.all([loadPurchases(), loadProducts(), loadSuppliers()]);
});
</script>
<template>
    <div class="card">
        <!-- TOOLBAR -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nueva Compra" icon="pi pi-plus" severity="secondary" @click="openCreate" />
            </template>
        </Toolbar>

        <!-- TITLE -->
        <div class="flex justify-content-between mb-3">
            <h3>Compras</h3>
        </div>

        <!-- HISTORIAL -->

        <DataTable :value="purchases" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" responsive-layout="scroll">
            <Column field="purchaseNumber" header="Compra" />

            <Column header="Fecha">
                <template #body="{ data }">
                    {{ new Date(data.purchaseDate).toLocaleDateString() }}
                </template>
            </Column>

            <Column header="Proveedor">
                <template #body="{ data }">
                    <Tag :value="data.supplier?.name" severity="info" />
                </template>
            </Column>

            <Column header="Productos">
                <template #body="{ data }">
                    <Tag v-for="detail in data.details" :key="detail.id" :value="`${detail.description} x${detail.quantity}`" class="mr-1 mb-1" />
                </template>
            </Column>

            <Column header="Total">
                <template #body="{ data }">
                    <strong>Bs {{ data.total }}</strong>
                </template>
            </Column>

            <Column header="Estado">
                <template #body="{ data }">
                    <Tag :severity="data.status === 'CONFIRMED' ? 'success' : 'danger'" :value="data.status" />
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="{ data }">
                    <Button icon="pi pi-eye" text rounded @click="viewPurchase(data)" />

                    <Button v-if="data.status === 'CONFIRMED'" icon="pi pi-times" severity="danger" text @click="cancelPurchase(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG NUEVA COMPRA -->

        <Dialog v-model:visible="dialogVisible" modal header="Nueva Compra" :style="{ width: '900px' }">
            <!-- PROVEEDOR -->

            <div class="field mb-4">
                <label>Proveedor</label>

                <AutoComplete v-model="selectedSupplier" :suggestions="filteredSuppliers" option-label="name" field="name" dropdown @complete="searchSuppliers" />
            </div>

            <!-- PRODUCTO -->

            <div class="field mb-4">
                <label>Producto</label>

                <div class="flex gap-2">
                    <AutoComplete v-model="selectedProduct" :suggestions="filteredProducts" option-label="name" field="name" dropdown class="flex-1" @complete="searchProducts" @item-select="addProduct" />

                    <Button icon="pi pi-plus" severity="success" @click="addProduct" />
                </div>
            </div>

            <!-- ITEMS -->

            <DataTable v-if="cartItems.length" :value="cartItems" class="mb-4">
                <Column field="name" header="Producto" />

                <Column header="Costo Unitario">
                    <template #body="{ data }">
                        <InputNumber v-model="data.unitCost" mode="decimal" :min="0" />
                    </template>
                </Column>

                <Column header="Cantidad">
                    <template #body="{ data }">
                        <InputNumber v-model="data.quantity" :min="1" show-buttons button-layout="horizontal" />
                    </template>
                </Column>

                <Column header="Subtotal">
                    <template #body="{ data }">
                        Bs
                        {{ (Number(data.unitCost) * Number(data.quantity)).toFixed(2) }}
                    </template>
                </Column>

                <Column header="">
                    <template #body="{ data }">
                        <Button icon="pi pi-trash" severity="danger" text @click="removeProduct(data.id)" />
                    </template>
                </Column>
            </DataTable>

            <!-- TOTAL -->

            <div v-if="cartItems.length" class="flex justify-content-end mb-4">
                <h4>Total: Bs {{ total.toFixed(2) }}</h4>
            </div>

            <!-- PAGO -->

            <div class="field mb-4">
                <label>Método de Pago</label>

                <Select v-model="form.paymentMethod" :options="paymentMethods" option-label="label" option-value="value" class="w-full" />
            </div>

            <template #footer>
                <Button label="Cancelar" text @click="dialogVisible = false" />

                <Button label="Confirmar Compra" icon="pi pi-check" severity="success" :loading="purchaseLoading" @click="createPurchase" />
            </template>
        </Dialog>

        <!-- DETALLE -->

        <Dialog v-model:visible="detailDialog" modal header="Detalle de Compra" :style="{ width: '800px' }">
            <div v-if="selectedPurchase">
                <div class="grid mb-4">
                    <div class="col-6">
                        <h5>Compra #{{ selectedPurchase.purchaseNumber }}</h5>
                    </div>

                    <div class="col-6">
                        <strong>Fecha:</strong>

                        {{ new Date(selectedPurchase.purchaseDate).toLocaleString() }}
                    </div>

                    <div class="col-12">
                        <strong>Proveedor:</strong>

                        {{ selectedPurchase.supplier?.name }}
                    </div>
                </div>

                <DataTable :value="selectedPurchase.details">
                    <Column field="code" header="Código" />

                    <Column field="description" header="Producto" />

                    <Column field="quantity" header="Cantidad" />

                    <Column header="Costo">
                        <template #body="{ data }">Bs {{ data.unitCost }}</template>
                    </Column>

                    <Column header="Total">
                        <template #body="{ data }">Bs {{ data.total }}</template>
                    </Column>
                </DataTable>

                <div class="mt-4 text-right mr-14">
                    <h4>Total: Bs {{ selectedPurchase.total }}</h4>
                </div>
            </div>
        </Dialog>
    </div>
</template>
