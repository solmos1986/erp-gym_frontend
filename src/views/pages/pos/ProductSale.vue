<script setup>
import ProductService from '@/modules/products/services/product.service.js';
import PartnerService from '@/service/partner.service';
import ProductSaleService from '@/service/productSale.service';
import SaleService from '@/service/sale.service';
import Select from 'primevue/select';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import PartnerDialog from '../../../components/partners/PartnerDialog.vue';

const toast = useToast();

// =========================
// STATE
// =========================

const loading = ref(false);
const purchaseLoading = ref(false);

const sales = ref([]);

const products = ref([]);
const partners = ref([]);

const dialogVisible = ref(false);

// =========================
// CLIENTES
// =========================
const partnerDialog = ref(false);
const selectedPartner = ref(null);
const filteredPartners = ref([]);

// =========================
// PRODUCTOS
// =========================

const selectedProduct = ref(null);
const filteredProducts = ref([]);

const cartItems = ref([]);

const detailDialog = ref(false);
const selectedSale = ref(null);
const detailLoading = ref(false);

// =========================
// PAGO
// =========================
const confirm = useConfirm();
const paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'QR', value: 'QR' },
    { label: 'Tarjeta', value: 'CARD' },
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Depósito', value: 'DEPOSIT' }
];

const form = ref({
    partnerId: null,
    paymentMethod: 'CASH'
});

// =========================
// COMPUTED
// =========================

const total = computed(() => {
    return cartItems.value.reduce((sum, item) => {
        return sum + Number(item.productBranches[0]?.salePrice || 0) * Number(item.quantity || 0);
    }, 0);
});
const productSales = computed(() => sales.value.filter((sale) => sale.details?.some((detail) => detail.itemType === 'PRODUCT')));

async function viewSale(sale) {
    detailLoading.value = true;

    try {
        selectedSale.value = await SaleService.getById(sale.id);
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
// LOADERS
// =========================

async function loadSales() {
    loading.value = true;

    try {
        sales.value = await SaleService.getAll();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando ventas',
            detail: error?.response?.data?.message || error.message,
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

async function loadProducts() {
    try {
        products.value = await ProductService.getAll({ Active: true });
        console.log('products.value ', products.value);
    } catch (error) {
        console.error(error);
    }
}

async function loadPartners() {
    try {
        partners.value = await PartnerService.getAll({
            type: 'CUSTOMER'
        });
    } catch (error) {
        console.error(error);
    }
}

// =========================
// AUTOCOMPLETE CLIENTES
// =========================

function searchPartners(event) {
    const query = event.query.toLowerCase();

    filteredPartners.value = partners.value.filter((partner) => partner.name.toLowerCase().includes(query));
}

// =========================
// AUTOCOMPLETE PRODUCTOS
// =========================

function searchProducts(event) {
    const query = event.query.toLowerCase();

    filteredProducts.value = products.value.filter((product) => product.name.toLowerCase().includes(query));
}

// =========================
// CART
// =========================
function addProduct() {
    console.log('Producto seleccionado', selectedProduct.value);
    if (!selectedProduct.value) return;

    const existing = cartItems.value.find((item) => item.id === selectedProduct.value.id);

    if (existing) {
        existing.quantity++;
    } else {
        cartItems.value.push({
            ...selectedProduct.value,
            quantity: 1
        });
    }

    console.log('Producto agregado al carrito', selectedProduct.value);
    selectedProduct.value = null;
}

function removeProduct(productId) {
    cartItems.value = cartItems.value.filter((item) => item.id !== productId);
}

async function purchase() {
    console.log('ANTES DEL IF');
    console.log('CART', cartItems.value);
    console.log('LENGTH', cartItems.value.length);
    console.log('JSON', JSON.stringify(cartItems.value));
    if (cartItems.value.length === 0) {
        console.log('ENTRO AL IF');
        toast.add({
            severity: 'warn',
            summary: 'Debe agregar al menos un producto',
            life: 3000
        });

        return;
    }
    console.log('VOY A HACER EL POST');
    purchaseLoading.value = true;

    try {
        await ProductSaleService.create({
            partnerId: selectedPartner.value?.id || null,

            items: cartItems.value.map((item) => ({
                productId: item.id,
                quantity: Number(item.quantity)
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
            summary: 'Venta registrada correctamente',
            life: 3000
        });

        dialogVisible.value = false;

        await loadSales();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error registrando venta',
            life: 3000
        });
    } finally {
        purchaseLoading.value = false;
    }
}

// =========================
// DIALOG
// =========================
async function onPartnerCreated(partner) {
    await loadPartners();

    selectedPartner.value = partner;

    partnerDialog.value = false;
}
function openCreate() {
    form.value = {
        partnerId: null,
        paymentMethod: 'CASH'
    };

    selectedPartner.value = null;

    selectedProduct.value = null;

    cartItems.value = [];

    dialogVisible.value = true;
}
const confirmAnnul = async (sale) => {
    console.log('Anulando venta', sale);

    try {
        const result = await SaleService.annul(sale.id);

        toast.add({
            severity: 'success',
            summary: 'Correcto',
            detail: 'Venta anulada correctamente',
            life: 3000
        });
        console.log(result);

        await loadSales();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.response?.data?.message || error.message,
            life: 5000
        });
    }
};
// =========================
// INIT
// =========================

onMounted(async () => {
    console.log('Cargando ventas...');
    await Promise.all([loadSales(), loadProducts(), loadPartners()]);
});
</script>
<template>
    <div class="card">
        <!-- TOOLBAR -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nueva Venta" icon="pi pi-plus" severity="secondary" @click="openCreate" />
            </template>
        </Toolbar>

        <!-- TITLE -->
        <div class="flex justify-content-between mb-3">
            <h3>Ventas de Productos</h3>
        </div>

        <!-- HISTORIAL -->

        <DataTable :value="productSales" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" responsive-layout="scroll">
            <Column field="saleNumber" header="Venta" />

            <Column header="Fecha">
                <template #body="{ data }">
                    {{ new Date(data.saleDate).toLocaleDateString() }}
                </template>
            </Column>

            <Column header="Cliente">
                <template #body="{ data }">
                    <Tag v-if="data.customer" :value="data.customer.name" severity="info" />

                    <Tag v-else value="Consumidor Final" severity="secondary" />
                </template>
            </Column>

            <Column header="Productos">
                <template #body="{ data }">
                    <Tag v-for="detail in data.details" :key="detail.description" :value="`${detail.description} x${detail.quantity}`" class="mr-1 mb-1" />
                </template>
            </Column>

            <Column header="Total">
                <template #body="{ data }">
                    <strong>Bs {{ data.total }}</strong>
                </template>
            </Column>
            <Column header="UnitCost">
                <template #body="{ data }">
                    <strong>Bs {{ data.details[0].unitCost }}</strong>
                </template>
            </Column>
            <Column header="Acciones">
                <template #body="{ data }">
                    <Button icon="pi pi-eye" text rounded @click="viewSale(data)" />

                    <Button v-if="data.status === 'CONFIRMED'" icon="pi pi-times" severity="danger" text @click="confirmAnnul(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG NUEVA VENTA -->
        <PartnerDialog v-model:visible="partnerDialog" mode="POS" @saved="onPartnerCreated" />
        <Dialog v-model:visible="dialogVisible" modal header="Nueva Venta" :style="{ width: '800px' }">
            <!-- CLIENTE -->

            <div class="field mb-4">
                <label>Cliente</label>

                <div class="flex gap-2">
                    <AutoComplete v-model="selectedPartner" :suggestions="filteredPartners" option-label="name" field="name" dropdown @complete="searchPartners" />

                    <Button icon="pi pi-plus" severity="success" @click="partnerDialog = true" />
                </div>
            </div>

            <!-- PRODUCTO -->

            <div class="field mb-4">
                <label>Producto</label>

                <div class="flex gap-2">
                    <AutoComplete v-model="selectedProduct" :suggestions="filteredProducts" option-label="name" field="name" dropdown class="flex-1" @complete="searchProducts" @item-select="addProduct" />

                    <Button icon="pi pi-plus" severity="success" @click="addProduct" />
                </div>
            </div>

            <DataTable v-if="cartItems.length" :value="cartItems" class="mb-4">
                <Column field="name" header="Producto" />

                <Column header="Precio">
                    <template #body="{ data }">Bs {{ data.productBranches[0]?.salePrice }}</template>
                </Column>

                <Column header="Cantidad">
                    <template #body="{ data }">
                        <InputNumber v-model="data.quantity" :min="1" show-buttons button-layout="horizontal" />
                    </template>
                </Column>

                <Column header="Subtotal">
                    <template #body="{ data }">Bs {{ data.productBranches[0]?.salePrice * data.quantity }}</template>
                </Column>

                <Column header="">
                    <template #body="{ data }">
                        <Button icon="pi pi-trash" severity="danger" text @click="removeProduct(data.id)" />
                    </template>
                </Column>
            </DataTable>
            <div v-if="cartItems.length" class="flex justify-content-end mb-4">
                <h4>Total: Bs {{ total }}</h4>
            </div>
            <div class="field mb-4">
                <label>Método de Pago</label>
                <div class="flex gap-2">
                    <Select v-model="form.paymentMethod" :options="paymentMethods" option-label="label" option-value="value" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" text @click="dialogVisible = false" />

                <Button label="Confirmar Venta" icon="pi pi-check" severity="success" :loading="purchaseLoading" @click="purchase" />
            </template>
        </Dialog>
        <Dialog v-model:visible="detailDialog" modal header="Detalle de Venta" :style="{ width: '700px' }">
            <div v-if="selectedSale">
                <div class="grid mb-4">
                    <div class="col-6 mb-1">
                        <h5>Venta #{{ selectedSale.saleNumber }}</h5>
                    </div>

                    <div class="col-6 ml-3 mb-2">
                        <strong>Fecha:</strong>
                        {{ new Date(selectedSale.saleDate).toLocaleString() }}
                    </div>

                    <div class="col-12 ml-3">
                        <strong>Cliente:</strong>
                        {{ selectedSale.customer?.name || 'Consumidor Final' }}
                    </div>
                </div>

                <DataTable :value="selectedSale.details">
                    <Column field="code" header="Código" />

                    <Column field="description" header="Producto" />

                    <Column field="quantity" header="Cantidad" />

                    <Column header="Precio">
                        <template #body="{ data }">{{ data.productBranches[0]?.salePrice }}</template>
                    </Column>

                    <Column header="Total">
                        <template #body="{ data }">Bs {{ data.total }}</template>
                    </Column>
                </DataTable>

                <div class="mt-4 text-right mr-14">
                    <h4>Total: Bs {{ selectedSale.total }}</h4>
                </div>
            </div>
        </Dialog>
    </div>
</template>
