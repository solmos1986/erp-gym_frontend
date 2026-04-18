<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import partnerService from '../../service/partner.service';
import productErpService from '../../service/product.service';
import purchaseService from '../../service/purchase.service';
import { useAuthStore } from '../../store/auth.store';

const props = defineProps({
    visible: Boolean,
    purchase: Object
});
const isEdit = computed(() => !!props.purchase?.id);
const emit = defineEmits(['close', 'created']);

const toast = useToast();
const auth = useAuthStore();

// ========================
// FORM
// ========================
const purchaseForm = ref({
    partner: null,
    invoiceNumber: '',
    notes: '',
    branchId: auth.user.branchId,
    items: []
});

const saving = ref(false);

// ========================
// CONFIRM MODAL
// ========================
const pendingPurchase = ref(null);
const showConfirmModal = ref(false);
const paymentMethods = ref([]);
const financialAccounts = ref([]);
const payments = ref([]);
const isCredit = ref(false);

const totalPaid = computed(() => payments.value.reduce((s, p) => s + Number(p.amount || 0), 0));

const remaining = computed(() => (pendingPurchase.value ? pendingPurchase.value.total - totalPaid.value : 0));

// ========================
// LOAD DATA
// ========================
onMounted(async () => {
    paymentMethods.value = await purchaseService.getPaymentMethodOptions();
    financialAccounts.value = await purchaseService.getFinancialAccounts();
});

// ========================
// PARTNER SEARCH
// ========================
const partnerSuggestions = ref([]);

async function searchPartner(event) {
    if (!event.query || event.query.length < 2) return;
    partnerSuggestions.value = await partnerService.search(event.query, {
        partnerType: 'SUPPLIER'
    });
}

// ========================
// PRODUCT SEARCH
// ========================
const productSuggestions = ref([]);

async function searchProduct(event) {
    if (!event.query || event.query.length < 2) return;
    productSuggestions.value = await productErpService.search(event.query);
}

// ========================
// ITEMS
// ========================
function addItem() {
    purchaseForm.value.items.push({
        product: null,
        productId: null,
        quantity: 1,
        price: 0,
        subtotal: 0
    });
}

function removeItem(index) {
    purchaseForm.value.items.splice(index, 1);
}

function onSelectProduct(item) {
    item.productId = item.product.id;
    item.price = item.product.purchasePrice || 0;
    recalc(item);
}

function recalc(item) {
    item.subtotal = Number(item.quantity) * Number(item.price);
}

const total = computed(() => purchaseForm.value.items.reduce((sum, i) => sum + Number(i.subtotal || 0), 0));

// ========================
// CREATE PURCHASE
// ========================
async function savePurchase() {
    console.log('Saving purchase with data:', purchaseForm.value);
    if (!purchaseForm.value.partner) {
        toast.add({ severity: 'warn', summary: 'Seleccione proveedor', life: 3000 });
        return;
    }

    if (!purchaseForm.value.items.length) {
        toast.add({ severity: 'warn', summary: 'Agregue productos', life: 3000 });
        return;
    }

    saving.value = true;

    try {
        const payload = {
            partnerId: purchaseForm.value.partner.id,
            branchId: purchaseForm.value.branchId,
            invoiceNumber: purchaseForm.value.invoiceNumber,
            notes: purchaseForm.value.notes,
            items: purchaseForm.value.items.map((i) => ({
                productId: i.productId,
                quantity: Number(i.quantity),
                price: Number(i.price)
            }))
        };

        let result;

        // 🔥 MODO EDICIÓN
        if (props.purchase?.id) {
            result = await purchaseService.updatePurchase(props.purchase.id, payload);

            toast.add({
                severity: 'success',
                summary: 'Compra actualizada',
                life: 3000
            });

            emit('saved');
            emit('close');
        }

        // ➕ MODO CREACIÓN
        else {
            result = await purchaseService.createPurchase(payload);

            pendingPurchase.value = result;

            // Abrir modal de confirmación solo cuando es nueva
            showConfirmModal.value = true;
        }
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'Error al guardar compra',
            life: 4000
        });
    } finally {
        saving.value = false;
    }
}

// ========================
// CONFIRM PURCHASE
// ========================
async function confirmPurchase() {
    try {
        await purchaseService.confirmPurchase(pendingPurchase.value.id, {
            payments: isCredit.value
                ? []
                : payments.value.map((p) => ({
                      methodOptionId: p.methodId,
                      financialAccountId: p.financialAccountId,
                      amount: p.amount
                  }))
        });

        toast.add({
            severity: 'success',
            summary: 'Compra confirmada',
            detail: `Pagado: Bs ${totalPaid.value} | Deuda: Bs ${remaining.value}`,
            life: 4000
        });

        showConfirmModal.value = false;
        emit('created');
        resetForm();
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error al confirmar compra',
            life: 3000
        });
    }
}
watch(
    () => [props.visible, props.purchase],
    ([visible, purchase]) => {
        if (!visible) return;

        if (!purchase || !purchase.items) {
            resetForm();
            return;
        }

        purchaseForm.value = {
            partner: purchase.partner,
            invoiceNumber: purchase.invoiceNumber || '',
            notes: purchase.notes || '',
            branchId: purchase.branchId,
            items: purchase.items.map((i) => ({
                product: i.product,
                productId: i.productId,
                quantity: Number(i.quantity),
                price: Number(i.price),
                subtotal: Number(i.subtotal)
            }))
        };
    },
    { immediate: true, deep: true }
);

// ========================
// RESET
// ========================
function resetForm() {
    purchaseForm.value = {
        partner: null,
        invoiceNumber: '',
        notes: '',
        branchId: auth.user.branchId,
        items: []
    };

    payments.value = [];
    isCredit.value = false;
    pendingPurchase.value = null;
}

// ========================
// CLOSE MAIN MODAL
// ========================
function closeModal() {
    resetForm();
    emit('close');
}
</script>

<template>
    <!-- ========================= -->
    <!-- CREATE PURCHASE MODAL -->
    <!-- ========================= -->
    <Dialog :visible="props.visible" modal header="Nueva Compra" style="width: 900px" @update:visible="closeModal">
        <div class="grid grid-cols-4 gap-4 mb-4">
            <AutoComplete v-model="purchaseForm.partner" :suggestions="partnerSuggestions" optionLabel="name" placeholder="Proveedor" @complete="searchPartner" />

            <InputText v-model="purchaseForm.invoiceNumber" placeholder="N° factura" />

            <InputText v-model="purchaseForm.notes" placeholder="Observaciones" />

            <div class="font-bold text-right text-lg">Total: Bs {{ total.toFixed(2) }}</div>
        </div>

        <DataTable :value="purchaseForm.items">
            <Column header="Producto">
                <template #body="{ data }">
                    <AutoComplete v-model="data.product" :suggestions="productSuggestions" optionLabel="name" @complete="searchProduct" @item-select="onSelectProduct(data)" />
                </template>
            </Column>

            <Column header="Cantidad">
                <template #body="{ data }">
                    <InputNumber v-model="data.quantity" @input="recalc(data)" />
                </template>
            </Column>

            <Column header="Precio">
                <template #body="{ data }">
                    <InputNumber v-model="data.price" @input="recalc(data)" />
                </template>
            </Column>

            <Column header="Subtotal">
                <template #body="{ data }"> Bs {{ data.subtotal?.toFixed(2) || 0 }} </template>
            </Column>

            <Column>
                <template #body="{ index }">
                    <Button icon="pi pi-trash" severity="danger" text @click="removeItem(index)" />
                </template>
            </Column>
        </DataTable>

        <Button label="Agregar producto" icon="pi pi-plus" class="mt-3" @click="addItem" />

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="closeModal" />
            <Button label="Crear Compra" severity="success" :loading="saving" @click="savePurchase" />
        </template>
    </Dialog>

    <!-- ========================= -->
    <!-- CONFIRM PURCHASE MODAL -->
    <!-- ========================= -->
    <Dialog v-model:visible="showConfirmModal" header="Confirmar Compra" modal style="width: 500px">
        <div v-if="pendingPurchase">
            <div class="mb-2"><b>Total:</b> Bs {{ pendingPurchase.total }}</div>

            <div class="flex items-center gap-2 mb-3">
                <Checkbox v-model="isCredit" binary />
                <label>Compra a crédito</label>
            </div>

            <div v-if="!isCredit">
                <div v-for="(p, i) in payments" :key="i" class="flex gap-2 mb-2">
                    <Dropdown v-model="p.methodId" :options="paymentMethods" optionLabel="name" optionValue="id" placeholder="Método" />

                    <Dropdown v-model="p.financialAccountId" :options="financialAccounts" optionLabel="name" optionValue="id" placeholder="Cuenta" />

                    <InputNumber v-model="p.amount" />

                    <Button icon="pi pi-trash" severity="danger" text @click="payments.splice(i, 1)" />
                </div>

                <Button
                    icon="pi pi-plus"
                    label="Agregar pago"
                    @click="
                        payments.push({
                            methodId: null,
                            financialAccountId: null,
                            amount: 0
                        })
                    "
                />
            </div>

            <div class="mt-3 border-t pt-2">
                <div>Pagado: Bs {{ totalPaid }}</div>
                <div class="font-bold">Deuda: Bs {{ remaining }}</div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="showConfirmModal = false" />
            <Button label="Confirmar" severity="success" @click="savePurchase" />
        </template>
    </Dialog>
</template>
