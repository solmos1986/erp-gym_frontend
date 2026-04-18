<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import cashMovementService from '../../service/cashmovement.service';
import cashRegisterService from '../../service/cashregister.service';
import partnerService from '../../service/partner.service';
import productErpService from '../../service/product.service';
import salesService from '../../service/sale.service';
import { useAuthStore } from '../../store/auth.store';
import SaleTicket from './SaleTicket.vue';

const toast = useToast();
const auth = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL;

const canManualIn = computed(() => auth.can('ERP_TREASURY_IN'));
const canManualOut = computed(() => auth.can('ERP_TREASURY_OUT'));

const companyName = computed(() => {
    console.log('companyName', currentCashRegister.value);
    return currentCashRegister.value?.cashBox?.branch?.company?.name || 'Empresa';
});

const branchName = computed(() => {
    return currentCashRegister.value?.cashBox?.branch?.name || 'Sucursal';
});

// ================= ESTADOS =================
const products = ref([]);
const cart = ref([]);
const loading = ref(false);
const showCart = ref(false);

// Venta actual impresa
const currentSale = ref(null);

// Cliente y sucursal
const selectedPartner = ref(null);
const selectedBranchId = ref(auth.user.branchId);

// Autocomplete clientes
const partnerSuggestions = ref([]);
const searchingPartner = ref(false);

// Impresión
const showPrint = ref(false);

// Crear cliente rápido
const showCreatePartner = ref(false);
const newPartner = ref({
    name: '',
    type: 'CLIENT',
    document: '',
    phone: '',
    email: '',
    address: ''
});

// Confirmación de venta
const showConfirmSale = ref(false);
const pendingSale = ref(null);
const showCancelSale = ref(false);
const cancelReason = ref('');

// Errores simples para validación
const errors = ref({});
// Cajas
const hasOpenCashRegister = ref(false);
const currentCashRegister = ref(null);

// ================= CIERRE DE CAJA =================
const showCloseCashModal = ref(false);
const realBalance = ref(null);
const closingResult = ref(null);

const difference = computed(() => {
    if (realBalance.value === null || !currentCashRegister.value) return 0;
    return Number(realBalance.value) - Number(currentCashRegister.value.currentBalance);
});

// ================= PAGOS =================
const paymentMethods = ref([]);
const payments = ref([]);
const isCredit = ref(false);

const totalPaid = computed(() => payments.value.reduce((sum, p) => sum + Number(p.amount || 0), 0));

const remaining = computed(() => {
    if (!pendingSale.value) return 0;
    return pendingSale.value.total - totalPaid.value;
});

//=========CHECK CAJAS ================
async function checkCashRegister() {
    try {
        const data = await cashRegisterService.getMyOpenCashRegister();
        currentCashRegister.value = data;
        hasOpenCashRegister.value = true;
    } catch (e) {
        hasOpenCashRegister.value = false;
    }
}
// ================= CARGA PRODUCTOS =================
async function loadProducts() {
    loading.value = true;
    try {
        products.value = await productErpService.getAll();
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error al cargar productos', life: 3000 });
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await checkCashRegister();
    if (hasOpenCashRegister.value) {
        await loadProducts();
    }
    paymentMethods.value = await salesService.getPaymentMethodOptions();
});

// ================= AUTOCOMPLETE CLIENTES =================
async function searchPartner(event) {
    const query = event.query;
    if (!query || query.length < 2) {
        partnerSuggestions.value = [];
        return;
    }

    searchingPartner.value = true;
    try {
        partnerSuggestions.value = await partnerService.search(query, {
            partnerType: 'CLIENT'
        });
    } catch (e) {
        console.error(e);
    } finally {
        searchingPartner.value = false;
    }
}

// ================= CARRITO =================
function addToCart(product) {
    const existing = cart.value.find((i) => i.productId === product.id);

    if (existing) {
        existing.quantity++;
        existing.subtotal = existing.quantity * existing.price;
    } else {
        cart.value.push({
            productId: product.id,
            name: product.name,
            price: product.salePrice,
            quantity: 1,
            subtotal: product.salePrice
        });
    }

    showCart.value = true;
}

function increaseQty(item) {
    item.quantity++;
    item.subtotal = item.quantity * item.price;
}

function decreaseQty(item) {
    if (item.quantity === 1) {
        removeFromCart(item.productId);
    } else {
        item.quantity--;
        item.subtotal = item.quantity * item.price;
    }
}

function removeFromCart(productId) {
    cart.value = cart.value.filter((i) => i.productId !== productId);
}

const cartTotal = computed(() => cart.value.reduce((sum, i) => sum + i.subtotal, 0));

// ================= FLUJO POS =================
const sendSale = async () => {
    if (!selectedPartner.value) {
        toast.add({ severity: 'warn', summary: 'Seleccione un cliente', life: 3000 });
        return;
    }

    if (!selectedBranchId.value) {
        toast.add({
            severity: 'error',
            summary: 'Usuario sin sucursal asignada',
            life: 4000
        });
        return;
    }

    if (cart.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'El carrito está vacío', life: 3000 });
        return;
    }

    const payload = {
        partnerId: selectedPartner.value.id,
        branchId: selectedBranchId.value,
        cashRegisterId: currentCashRegister.value.id,
        items: cart.value.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price
        })),
        paymentMethods: payments.value.map((p) => ({
            methodOptionId: p.methodOptionId, // Usamos methodOptionId
            amount: p.amount
        }))
    };

    const saleDraft = await salesService.createSale(payload);
    pendingSale.value = saleDraft;
    showConfirmSale.value = true;
    try {
        const saleDraft = await salesService.createSale(payload);
        console.log('enviar venta', saleDraft);
        pendingSale.value = saleDraft;
        showConfirmSale.value = true;

        // Inicializar cobro por defecto (Efectivo = Total)
        const efectivo = paymentMethods.value.find((m) => m.name.toLowerCase() === 'efectivo');

        payments.value = efectivo ? [{ methodOptionId: efectivo.id, amount: saleDraft.total }] : [];
        isCredit.value = false;
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error al crear la venta',
            life: 3000
        });
    }
};

async function confirmAndPrint() {
    try {
        const payload = {
            payments: payments.value.map((p) => ({
                methodOptionId: p.methodOptionId, // Asegúrate de enviar methodOptionId aquí
                amount: p.amount
            }))
        };

        await salesService.confirmSale(pendingSale.value.id, payload);

        const salePrinted = await salesService.printSale(pendingSale.value.id);
        currentSale.value = salePrinted;

        showConfirmSale.value = false;
        showPrint.value = true;

        setTimeout(() => {
            window.print();
            showPrint.value = false;
        }, 300);

        toast.add({
            severity: 'success',
            summary: 'Venta completada',
            detail: `Pagado: Bs ${totalPaid.value} | Deuda: Bs ${remaining.value}`,
            life: 4000
        });

        // Limpiar POS
        cart.value = [];
        selectedPartner.value = null;
        showCart.value = false;
        pendingSale.value = null;
        payments.value = [];
        isCredit.value = false;
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error al confirmar o imprimir',
            life: 3000
        });
    }
}

watch(isCredit, (value) => {
    if (value) {
        // Venta a crédito → no hay pagos
        payments.value = [];
    } else {
        // Venta normal → pago por defecto en efectivo
        const efectivo = paymentMethods.value.find((m) => m.name.toLowerCase() === 'efectivo');
        payments.value = efectivo && pendingSale.value ? [{ methodId: efectivo.id, amount: pendingSale.value.total }] : [];
        console.log('payments.value', payments.value);
    }
});

function cancelSalePreview() {
    pendingSale.value = null;
    showConfirmSale.value = false;
}

// ================= CREAR CLIENTE RÁPIDO =================
function openCreatePartnerModal() {
    newPartner.value = {
        name: '',
        type: 'CLIENT',
        document: '',
        phone: '',
        email: '',
        address: ''
    };
    errors.value = {};
    showCreatePartner.value = true;
}

function isInvalid(field) {
    return !!errors.value[field];
}

async function createPartner() {
    errors.value = {};

    if (!newPartner.value.name) errors.value.name = true;
    if (!newPartner.value.document) errors.value.document = true;

    if (Object.keys(errors.value).length > 0) {
        toast.add({
            severity: 'warn',
            summary: 'Campos obligatorios',
            detail: 'Complete nombre y NIT/CI',
            life: 3000
        });
        return;
    }

    try {
        const partner = await partnerService.create(newPartner.value);
        selectedPartner.value = partner;
        showCreatePartner.value = false;
        toast.add({
            severity: 'success',
            summary: 'Cliente creado',
            life: 2000
        });
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error al crear cliente',
            life: 3000
        });
    }
}
async function cancelSale() {
    if (!cancelReason.value || cancelReason.value.length < 5) {
        toast.add({
            severity: 'warn',
            summary: 'Motivo obligatorio',
            detail: 'Debe indicar un motivo válido',
            life: 3000
        });
        return;
    }

    try {
        await salesService.cancelSale(currentSale.value.id, {
            reason: cancelReason.value
        });

        toast.add({
            severity: 'success',
            summary: 'Venta anulada correctamente',
            life: 3000
        });

        showCancelSale.value = false;
        cancelReason.value = '';
        currentSale.value = null;
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error al anular la venta',
            life: 3000
        });
    }
}
async function closeCashRegister() {
    if (!currentCashRegister.value?.id) {
        toast.add({
            severity: 'error',
            summary: 'Caja inválida',
            detail: 'No hay una caja activa para cerrar',
            life: 3000
        });
        return;
    }

    if (realBalance.value === null) {
        toast.add({
            severity: 'warn',
            summary: 'Saldo real requerido',
            detail: 'Debe ingresar el saldo contado',
            life: 3000
        });
        return;
    }
    try {
        const result = await cashRegisterService.closeCashRegister({
            cashRegisterId: currentCashRegister.value.id,
            realBalance: realBalance.value
        });

        closingResult.value = result;

        toast.add({
            severity: 'success',
            summary: 'Caja cerrada correctamente',
            detail: `Sistema: Bs ${result.systemBalance} | Real: Bs ${result.realBalance} | Diferencia: Bs ${result.difference}`,
            life: 5000
        });

        // Limpiar estado
        showCloseCashModal.value = false;
        realBalance.value = null;
        currentCashRegister.value = null;
        hasOpenCashRegister.value = false;
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error al cerrar la caja',
            life: 4000
        });
    }
}
// ================= TESORERÍA (INGRESO / EGRESO MANUAL) =================
const showTreasuryModal = ref(false);
const treasuryType = ref(null); // 'IN' | 'OUT'
const treasuryAmount = ref(null);
const treasuryReference = ref('');

function openTreasuryModal(type) {
    treasuryType.value = type;
    treasuryAmount.value = null;
    treasuryReference.value = '';
    showTreasuryModal.value = true;
}

async function saveTreasuryMovement() {
    if (!treasuryAmount.value || treasuryAmount.value <= 0) {
        toast.add({
            severity: 'warn',
            summary: 'Monto inválido',
            detail: 'Debe ingresar un monto mayor a 0',
            life: 3000
        });
        return;
    }

    try {
        const payload = {
            amount: Number(treasuryAmount.value),
            reference: treasuryReference.value || null
        };

        if (treasuryType.value === 'IN') {
            await cashMovementService.manualIn(payload);
        } else if (treasuryType.value === 'OUT') {
            await cashMovementService.manualOut(payload);
        }

        toast.add({
            severity: 'success',
            summary: treasuryType.value === 'IN' ? 'Ingreso registrado' : 'Egreso registrado',
            detail: `Bs ${treasuryAmount.value}`,
            life: 3000
        });

        // Cerrar modal
        showTreasuryModal.value = false;

        // Limpiar datos
        treasuryAmount.value = null;
        treasuryReference.value = '';

        // Opcional: refrescar la caja abierta para actualizar saldo
        await checkCashRegister();
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Error en tesorería',
            detail: e.response?.data?.message || 'No se pudo registrar el movimiento',
            life: 4000
        });
    }
}
</script>

<template>
    <div v-if="!hasOpenCashRegister" class="flex flex-col items-center justify-center h-[80vh]">
        <i class="pi pi-lock text-5xl text-gray-400 mb-4"></i>
        <h2 class="text-xl font-bold mb-2">Caja cerrada</h2>
        <p class="text-gray-500 mb-4">Debe abrir una caja antes de comenzar a vender.</p>
        <Button label="Abrir Caja" icon="pi pi-unlock" severity="success" @click="$router.push('/open-cash-register')" />
    </div>
    <div v-else>
        <!-- PANEL DE CAJA ABIERTA -->
        <div class="bg-green-50 border border-green-300 rounded-lg p-4 mb-4 shadow-sm">
            <div class="flex justify-between items-center">
                <div>
                    <div class="text-lg font-bold text-green-700">🟢 Caja: {{ currentCashRegister.cashBox?.name }}</div>
                    <div class="text-sm text-gray-600">Cajero: {{ auth.user.name }}</div>
                    <div class="text-sm text-gray-600">Abierta desde: {{ new Date(currentCashRegister.openAt).toLocaleTimeString() }}</div>
                    <div><Button label="Cerrar Caja" icon="pi pi-lock" severity="danger" size="small" @click="showCloseCashModal = true" /></div>
                    <div class="flex gap-2 mt-2">
                        <Button v-if="canManualIn" label="Ingreso manual" icon="pi pi-plus" severity="success" size="small" @click="openTreasuryModal('IN')" />

                        <Button v-if="canManualOut" label="Egreso manual" icon="pi pi-minus" severity="danger" size="small" @click="openTreasuryModal('OUT')" />
                    </div>
                </div>

                <div class="text-right">
                    <div class="text-sm">Saldo inicial:</div>
                    <div class="font-semibold">Bs {{ currentCashRegister.initialBalance }}</div>

                    <div class="text-sm mt-1">Saldo actual:</div>
                    <div class="font-bold text-lg text-green-700">Bs {{ currentCashRegister.currentBalance }}</div>
                </div>
            </div>
        </div>
        <div class="relative">
            <!-- BOTÓN CARRITO -->
            <Button icon="pi pi-shopping-cart" class="fixed bottom-4 right-4 z-50" severity="success" rounded @click="showCart = true" />

            <!-- GRID PRODUCTOS -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="product in products" :key="product.id" class="bg-white rounded-xl shadow p-3 cursor-pointer hover:shadow-lg transition flex flex-col h-72" @click="addToCart(product)">
                    <div class="w-full h-36 flex items-center justify-center bg-gray-100 rounded">
                        <img v-if="product.imageUrl" :src="API_URL + product.imageUrl" class="max-h-full max-w-full object-contain" />
                        <span v-else class="text-gray-400 text-sm">Sin imagen</span>
                    </div>

                    <div class="flex-1 flex flex-col justify-between mt-3">
                        <h5 class="font-semibold text-sm text-center truncate">
                            {{ product.name }}
                        </h5>

                        <div class="flex justify-between items-center mt-2">
                            <span class="text-green-600 font-bold"> Bs {{ product.salePrice }} </span>
                            <i class="pi pi-cart-plus text-xl text-gray-500"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SIDEBAR CARRITO -->
            <Sidebar v-model:visible="showCart" position="right" class="w-full md:w-96" header="Carrito">
                <div class="flex flex-col h-full">
                    <div class="flex-1 overflow-y-auto">
                        <div v-if="cart.length === 0" class="text-gray-400 text-center mt-10">Carrito vacío</div>

                        <div v-for="item in cart" :key="item.productId" class="flex justify-between items-center mb-3 border-b pb-2">
                            <div>
                                <div class="font-semibold text-sm">{{ item.name }}</div>
                                <div class="text-xs text-gray-500">{{ item.quantity }} x Bs {{ item.price }}</div>
                            </div>

                            <div class="flex items-center gap-2">
                                <Button icon="pi pi-minus" text @click="decreaseQty(item)" />
                                <span>{{ item.quantity }}</span>
                                <Button icon="pi pi-plus" text @click="increaseQty(item)" />
                            </div>

                            <span class="font-bold text-green-600"> Bs {{ item.subtotal }} </span>
                        </div>
                    </div>

                    <!-- TOTAL + CLIENTE -->
                    <div class="border-t pt-3">
                        <div class="flex justify-between font-bold text-lg mb-3">
                            <span>Total:</span>
                            <span>Bs {{ cartTotal }}</span>
                        </div>

                        <div class="w-full mb-3">
                            <AutoComplete
                                v-model="selectedPartner"
                                :suggestions="partnerSuggestions"
                                @complete="searchPartner"
                                optionLabel="name"
                                placeholder="Buscar cliente por nombre o NIT"
                                class="w-full"
                                inputClass="w-full"
                                :loading="searchingPartner"
                            >
                                <template #empty>
                                    <div class="p-2 text-center w-full">
                                        <Button class="w-full" label="Crear nuevo cliente" icon="pi pi-plus" size="small" @click="openCreatePartnerModal" />
                                    </div>
                                </template>
                            </AutoComplete>
                        </div>

                        <Button label="Cobrar" icon="pi pi-check" class="w-full" severity="success" :disabled="cart.length === 0" @click="sendSale" />
                    </div>
                </div>
            </Sidebar>

            <!-- TICKET -->
            <SaleTicket v-if="showPrint && currentSale" :sale="currentSale" :companyName="companyName" :branchName="branchName" />
            <Button label="Anular venta" severity="danger" icon="pi pi-times" @click="showCancelSale = true" />
            <!-- MODAL CREAR CLIENTE -->
            <Dialog v-model:visible="showCreatePartner" modal header="Nuevo Cliente" style="width: 500px">
                <div class="grid grid-cols-1 gap-3">
                    <div>
                        <label class="block font-medium mb-1">Nombre</label>
                        <InputText v-model="newPartner.name" class="w-full" :class="{ 'p-invalid': isInvalid('name') }" />
                    </div>

                    <div>
                        <label class="block font-medium mb-1">Documento (NIT/CI)</label>
                        <InputText v-model="newPartner.document" class="w-full" :class="{ 'p-invalid': isInvalid('document') }" />
                    </div>

                    <div>
                        <label class="block font-medium mb-1">Teléfono</label>
                        <InputText v-model="newPartner.phone" class="w-full" />
                    </div>

                    <div>
                        <label class="block font-medium mb-1">Email</label>
                        <InputText v-model="newPartner.email" class="w-full" />
                    </div>

                    <div>
                        <label class="block font-medium mb-1">Dirección</label>
                        <Textarea v-model="newPartner.address" class="w-full" rows="2" />
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Cancelar" severity="secondary" @click="showCreatePartner = false" />
                    <Button label="Guardar" severity="success" @click="createPartner" />
                </div>
            </Dialog>

            <!-- MODAL CONFIRMAR VENTA -->
            <Dialog v-model:visible="showConfirmSale" header="Cobrar venta" modal style="width: 600px">
                <div v-if="pendingSale">
                    <div class="mb-3"><b>Cliente:</b> {{ selectedPartner.name }}</div>

                    <div class="mb-3 text-lg font-bold">Total venta: Bs {{ pendingSale.total }}</div>

                    <!-- Checkbox crédito -->
                    <div class="flex items-center gap-2 mb-4">
                        <Checkbox v-model="isCredit" binary />
                        <label class="font-semibold">Venta a crédito</label>
                    </div>

                    <!-- Pagos -->
                    <div v-if="!isCredit">
                        <div v-for="(p, index) in payments" :key="index" class="flex gap-2 items-center mb-2">
                            <Dropdown v-model="p.methodId" :options="paymentMethods" optionLabel="name" optionValue="id" placeholder="Método" class="w-1/2" />

                            <InputNumber v-model="p.amount" mode="decimal" :min="0" class="w-1/3" placeholder="Monto" />

                            <Button icon="pi pi-trash" severity="danger" text @click="payments.splice(index, 1)" />
                        </div>

                        <Button icon="pi pi-plus" label="Agregar método" class="mt-2" severity="secondary" @click="payments.push({ methodId: null, amount: 0 })" />
                    </div>

                    <!-- Totales -->
                    <div class="mt-4 border-t pt-3">
                        <div>Pagado: Bs {{ totalPaid }}</div>
                        <div class="font-bold">Deuda: Bs {{ remaining }}</div>
                    </div>
                </div>

                <template #footer>
                    <Button label="Cancelar" severity="secondary" @click="cancelSalePreview" />
                    <Button label="Confirmar venta" severity="success" @click="confirmAndPrint" />
                </template>
            </Dialog>

            <Dialog v-model:visible="showCancelSale" header="Anular venta" modal style="width: 400px">
                <div>
                    <label class="block font-medium mb-2">Motivo de anulación</label>
                    <Textarea v-model="cancelReason" rows="3" class="w-full" placeholder="Explique por qué se anula la venta" />
                </div>

                <template #footer>
                    <Button label="Cancelar" severity="secondary" @click="showCancelSale = false" />
                    <Button label="Confirmar anulación" severity="danger" @click="cancelSale" />
                </template>
            </Dialog>
            <Dialog v-model:visible="showCloseCashModal" header="Cierre de Caja" modal style="width: 400px">
                <div v-if="currentCashRegister">
                    <div class="mb-3">
                        <b>Saldo según sistema:</b>
                        <div class="text-lg">Bs {{ currentCashRegister.currentBalance }}</div>
                    </div>

                    <div class="mb-3">
                        <label class="block font-medium mb-1"> Dinero contado en caja (real) </label>
                        <InputNumber v-model="realBalance" mode="decimal" class="w-full" placeholder="Ingrese el monto real" />
                    </div>

                    <div class="mb-3">
                        <b>Diferencia:</b>
                        <div
                            :class="{
                                'text-green-600': difference === 0,
                                'text-red-600': difference < 0,
                                'text-blue-600': difference > 0
                            }"
                            class="text-lg font-bold"
                        >
                            Bs {{ difference }}
                        </div>
                    </div>

                    <div v-if="difference !== 0" class="text-sm text-gray-600">
                        <span v-if="difference < 0">Faltante en caja.</span>
                        <span v-else>Sobrante en caja.</span>
                    </div>
                </div>

                <template #footer>
                    <Button label="Cancelar" severity="secondary" @click="showCloseCashModal = false" />
                    <Button label="Confirmar cierre" severity="danger" @click="closeCashRegister" :disabled="realBalance === null" />
                </template>
            </Dialog>

            <!-- ================= MODAL TESORERÍA ================= -->
            <Dialog v-model:visible="showTreasuryModal" modal :header="treasuryType === 'IN' ? 'Ingreso manual de dinero' : 'Egreso manual de dinero'" style="width: 400px">
                <div class="flex flex-col gap-3">
                    <div>
                        <label class="block font-medium mb-1">Monto (Bs)</label>
                        <InputNumber v-model="treasuryAmount" class="w-full" mode="decimal" :min="0" placeholder="Ingrese el monto" />
                    </div>

                    <div>
                        <label class="block font-medium mb-1">Referencia / Concepto</label>
                        <InputText v-model="treasuryReference" class="w-full" placeholder="Ej: Pago de internet, retiro personal, capital del dueño..." />
                    </div>
                </div>

                <template #footer>
                    <Button label="Cancelar" severity="secondary" @click="showTreasuryModal = false" />
                    <Button :label="treasuryType === 'IN' ? 'Registrar ingreso' : 'Registrar egreso'" :severity="treasuryType === 'IN' ? 'success' : 'danger'" @click="saveTreasuryMovement" :disabled="!treasuryAmount || treasuryAmount <= 0" />
                </template>
            </Dialog>
        </div>
    </div>
</template>

<style scoped></style>
