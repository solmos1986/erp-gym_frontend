<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import ProductService from '@/modules/products/services/product.service';
import InventoryMovementService from '@/service/inventoryMovement.service';

import { useAuthStore } from '@/store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const loading = ref(false);

const movements = ref([]);
const products = ref([]);

const dialogVisible = ref(false);

const form = ref({
    productId: null,
    movementType: null,
    quantity: null,
    notes: ''
});

// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_INVENTORY_VIEW'));

const canCreate = computed(() => auth.can('TENANT_INVENTORY_CREATE'));

// =====================
// TIPOS MOVIMIENTO
// =====================
const movementTypes = [
    { label: 'Stock Inicial', value: 'INITIAL_STOCK' },
    { label: 'Compra', value: 'PURCHASE' },
    { label: 'Venta', value: 'SALE' },
    { label: 'Ajuste Entrada', value: 'ADJUSTMENT_IN' },
    { label: 'Ajuste Salida', value: 'ADJUSTMENT_OUT' },
    { label: 'Transferencia Entrada', value: 'TRANSFER_IN' },
    { label: 'Transferencia Salida', value: 'TRANSFER_OUT' }
];

// =====================
// CARGAS
// =====================
async function loadMovements() {
    loading.value = true;

    try {
        movements.value = await InventoryMovementService.getAll();
    } finally {
        loading.value = false;
    }
}

async function loadProducts() {
    products.value = await ProductService.getAll({
        isActive: true
    });
}

// =====================
// NUEVO MOVIMIENTO
// =====================
function openCreate() {
    form.value = {
        productId: null,
        movementType: null,
        quantity: null,
        notes: ''
    };

    dialogVisible.value = true;
}

// =====================
// GUARDAR
// =====================
async function save() {
    try {
        if (!form.value.productId) {
            toast.add({
                severity: 'warn',
                summary: 'Seleccione un producto',
                life: 3000
            });

            return;
        }

        if (!form.value.movementType) {
            toast.add({
                severity: 'warn',
                summary: 'Seleccione un tipo de movimiento',
                life: 3000
            });

            return;
        }

        if (!form.value.quantity) {
            toast.add({
                severity: 'warn',
                summary: 'Ingrese una cantidad',
                life: 3000
            });

            return;
        }

        await InventoryMovementService.create(form.value);

        toast.add({
            severity: 'success',
            summary: 'Movimiento registrado',
            life: 3000
        });

        dialogVisible.value = false;

        await loadMovements();
    } catch (error) {
        console.error(error);

        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error registrando movimiento',
            life: 3000
        });
    }
}

function getMovementLabel(type) {
    const map = {
        INITIAL_STOCK: 'Stock Inicial',
        PURCHASE: 'Compra',
        SALE: 'Venta',
        ADJUSTMENT_IN: 'Ajuste Entrada',
        ADJUSTMENT_OUT: 'Ajuste Salida',
        TRANSFER_IN: 'Transferencia Entrada',
        TRANSFER_OUT: 'Transferencia Salida'
    };

    return map[type] || type;
}

function getMovementSeverity(type) {
    if (type === 'INITIAL_STOCK' || type === 'PURCHASE' || type === 'ADJUSTMENT_IN' || type === 'TRANSFER_IN') {
        return 'success';
    }

    return 'danger';
}
// =====================
// INIT
// =====================
onMounted(async () => {
    await Promise.all([loadMovements(), loadProducts()]);
});
</script>
<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button v-if="canCreate" label="Nuevo Movimiento" icon="pi pi-plus" severity="secondary" @click="openCreate" />
            </template>
        </Toolbar>

        <div class="flex justify-content-between mb-3">
            <h3>Movimientos de Inventario</h3>
        </div>

        <DataTable v-if="canView" :value="movements" :loading="loading">
            <Column header="Fecha">
                <template #body="{ data }">
                    {{ new Date(data.createdAt).toLocaleString() }}
                </template>
            </Column>

            <Column header="Producto">
                <template #body="{ data }">
                    {{ data.product?.name }}
                </template>
            </Column>

            <Column header="Código">
                <template #body="{ data }">
                    {{ data.product?.code }}
                </template>
            </Column>

            <Column header="Tipo">
                <template #body="{ data }">
                    <Tag :value="getMovementLabel(data.movementType)" :severity="getMovementSeverity(data.movementType)" />
                </template>
            </Column>

            <Column field="quantity" header="Cantidad" />
            <Column field="unitCost" header="Precio" />
            <Column field="status" header="Estado" />
            <Column header="Usuario">
                <template #body="{ data }">
                    {{ data.createdBy?.fullName }}
                </template>
            </Column>

            <Column field="notes" header="Observaciones" />
        </DataTable>

        <Dialog v-model:visible="dialogVisible" modal header="Nuevo Movimiento" style="width: 700px">
            <div class="grid">
                <div class="col-12">
                    <label>Producto</label>

                    <Dropdown v-model="form.productId" :options="products" option-label="name" option-value="id" placeholder="Seleccionar producto" filter class="w-full" />
                </div>

                <div class="col-12 md:col-6">
                    <label>Tipo Movimiento</label>

                    <Dropdown v-model="form.movementType" :options="movementTypes" option-label="label" option-value="value" placeholder="Seleccionar tipo" class="w-full" />
                </div>

                <div class="col-12 md:col-6">
                    <label>Cantidad</label>

                    <InputNumber v-model="form.quantity" mode="decimal" :min-fraction-digits="2" class="w-full" />
                </div>

                <div class="col-12">
                    <label>Observaciones</label>

                    <InputText v-model="form.notes" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" text @click="dialogVisible = false" />

                <Button label="Guardar" severity="success" @click="save" />
            </template>
        </Dialog>
    </div>
</template>
