<script setup>
import Popover from 'primevue/popover';
import ToggleSwitch from 'primevue/toggleswitch';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref, watch } from 'vue';
const visible = defineModel('visible');

const emit = defineEmits(['save']);
const toast = useToast();
const props = defineProps({
    categories: {
        type: Array,
        default: () => []
    },

    editingProduct: {
        type: Object,
        default: null
    },

    // Materias primas para el AutoComplete
    materials: {
        type: Array,
        default: () => []
    }
});
const costInfo = ref();

const toggleCostInfo = (event) => {
    costInfo.value.toggle(event);
};
// =====================================================
// FORMULARIO
// =====================================================

function defaultForm() {
    return {
        // ===========================
        // PRODUCTO
        // ===========================

        code: '',
        barcode: '',

        name: '',
        description: '',
        imageUrl: '',

        productCategoryId: null,

        productType: 'FINISHED_PRODUCT',
        sourceType: 'PURCHASE',

        unit: 'UNIT',

        costPrice: 0,
        salePrice: 0,

        currentStock: 0,

        minStock: 0,
        maxStock: 0,
        reorderPoint: 0,

        isActive: true,

        // ===========================
        // BOM
        // ===========================

        bom: {
            name: '',
            description: '',
            indirectCostPercent: 0,

            items: []
        }
    };
}

const form = reactive(defaultForm());

// =====================================================
// AUTOCOMPLETE
// =====================================================

const selectedMaterial = ref(null);
const filteredMaterials = ref([]);

// =====================================================
// WATCH EDITAR
// =====================================================

watch(
    () => props.editingProduct,
    (product) => {
        Object.assign(form, defaultForm());

        if (!product) return;

        // =====================================================
        // PRODUCTO
        // =====================================================

        form.code = product.code ?? '';
        form.barcode = product.barcode ?? '';

        form.name = product.name ?? '';
        form.description = product.description ?? '';
        form.imageUrl = product.imageUrl ?? '';

        form.productCategoryId = product.productCategoryId ?? null;

        form.productType = product.productType;
        form.sourceType = product.sourceType;

        form.unit = product.unit;

        const branchData = product.productBranches?.[0];

        form.costPrice = Number(branchData?.costPrice ?? 0);
        form.salePrice = Number(branchData?.salePrice ?? 0);

        form.currentStock = Number(branchData?.currentStock ?? 0);

        form.minStock = Number(branchData?.minStock ?? 0);
        form.maxStock = Number(branchData?.maxStock ?? 0);
        form.reorderPoint = Number(branchData?.reorderPoint ?? 0);

        form.isActive = product.isActive;

        // =====================================================
        // BOM
        // =====================================================

        form.bom = {
            name: '',
            description: '',
            indirectCostPercent: 10,
            items: []
        };

        if (product.bom?.length) {
            const currentBom = product.bom[0];

            form.bom.name = currentBom.name ?? '';
            form.bom.description = currentBom.description ?? '';

            form.bom.items = currentBom.items.map((item) => ({
                materialId: item.material.id,

                productCode: item.material.code,

                productName: item.material.name,

                unit: item.material.unit,

                unitCost: Number(item.material.productBranches?.[0]?.costPrice ?? 0),

                quantity: Number(item.quantity),

                wastePercent: Number(item.wastePercent ?? 0),

                notes: item.notes ?? ''
            }));
        }
    },
    {
        immediate: true
    }
);

// =====================================================
// LIMPIAR FORMULARIO
// =====================================================

watch(
    () => visible.value,
    (show) => {
        if (!show) {
            Object.assign(form, defaultForm());

            selectedMaterial.value = null;
            filteredMaterials.value = [];
        }
    }
);

// =====================================================
// CATÁLOGOS
// =====================================================

const productTypes = [
    {
        label: 'Materia Prima',
        value: 'RAW_MATERIAL'
    },
    {
        label: 'Producto Terminado',
        value: 'FINISHED_PRODUCT'
    },
    {
        label: 'Servicio',
        value: 'SERVICE'
    }
];

const sourceTypes = [
    {
        label: 'Compra',
        value: 'PURCHASE'
    },
    {
        label: 'Producción',
        value: 'PRODUCTION'
    },
    {
        label: 'Compra o Producción',
        value: 'BOTH'
    }
];

const units = [
    { label: 'Unidad', value: 'UNIT' },
    { label: 'Kilogramo', value: 'KG' },
    { label: 'Gramo', value: 'GRAM' },
    { label: 'Litro', value: 'LITER' },
    { label: 'Mililitro', value: 'ML' },
    { label: 'Caja', value: 'BOX' },
    { label: 'Paquete', value: 'PACKAGE' },
    { label: 'Botella', value: 'BOTTLE' },
    { label: 'Metro', value: 'METER' },
    { label: 'Centímetro', value: 'CM' },
    { label: 'Milímetro', value: 'MM' },
    { label: 'Par', value: 'PAIR' },
    { label: 'Rollo', value: 'ROLL' },
    { label: 'Docena', value: 'DOZEN' }
];
// =====================================================
// AUTOCOMPLETE
// =====================================================

function searchMaterials(event) {
    const query = event.query.toLowerCase();

    filteredMaterials.value = props.materials.filter((material) => {
        return material.name.toLowerCase().includes(query) || material.code?.toLowerCase().includes(query) || material.barcode?.toLowerCase().includes(query);
    });
}

// =====================================================
// AGREGAR MATERIAL
// =====================================================

function addItem() {
    if (!selectedMaterial.value) return;

    const exists = form.bom.items.find((item) => item.materialId === selectedMaterial.value.id);

    if (exists) {
        toast.add({
            severity: 'warn',
            summary: 'Materia Prima duplicada',
            detail: `La materia prima "${selectedMaterial.value.name}" ya forma parte de esta receta.`,
            life: 3000
        });
        selectedMaterial.value = null;
        return;
    }

    form.bom.items.push({
        materialId: selectedMaterial.value.id,

        productCode: selectedMaterial.value.code,

        productName: selectedMaterial.value.name,

        unit: selectedMaterial.value.unit,

        unitCost: Number(selectedMaterial.value.productBranches?.[0]?.costPrice ?? 0),

        quantity: 1,

        wastePercent: 0,

        notes: ''
    });

    selectedMaterial.value = null;
}

// =====================================================
// ELIMINAR MATERIAL
// =====================================================

function removeItem(index) {
    form.bom.items.splice(index, 1);
}

// =====================================================
// COSTO PRODUCCIÓN
// =====================================================

const productionCost = computed(() => {
    return form.bom.items.reduce((total, item) => {
        return total + item.quantity * item.unitCost;
    }, 0);
});

// =====================================================
// COSTO TOTAL
// =====================================================

const totalProductionCost = computed(() => {
    return productionCost.value * (1 + form.bom.indirectCostPercent / 100);
});
// =====================================================
// GUARDAR PRODUCTO
// =====================================================

function saveProduct() {
    // ==========================
    // PRODUCTO
    // ==========================

    const product = {
        code: form.code,
        barcode: form.barcode,

        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,

        productCategoryId: form.productCategoryId,

        productType: form.productType,
        sourceType: form.sourceType,

        unit: form.unit,

        costPrice: form.costPrice,
        salePrice: form.salePrice,

        currentStock: form.currentStock,

        minStock: form.minStock,
        maxStock: form.maxStock,
        reorderPoint: form.reorderPoint,

        isActive: form.isActive
    };

    // ==========================
    // BOM
    // ==========================

    let bom = null;

    const requiresBom = form.productType === 'FINISHED_PRODUCT' && (form.sourceType === 'PRODUCTION' || form.sourceType === 'BOTH');

    if (requiresBom) {
        bom = {
            name: form.bom.name?.trim() || null,

            description: form.bom.description?.trim() || null,

            indirectCostPercent: form.bom.indirectCostPercent,

            items: form.bom.items.map((item) => ({
                materialId: item.materialId,

                quantity: Number(item.quantity),

                wastePercent: Number(item.wastePercent ?? 0),

                notes: item.notes?.trim() || null
            }))
        };
    }

    emit('save', {
        product,
        bom
    });
}
</script>

<template>
    <Dialog v-model:visible="visible" modal :style="{ width: '95vw', maxWidth: '1700px' }" :header="props.editingProduct ? 'Editar Producto' : 'Nuevo Producto'" class="product-dialog">
        <div class="flex flex-col md:flex-row gap-8">
            <!-- ===================================================== -->
            <!-- COLUMNA IZQUIERDA                                     -->
            <!-- ===================================================== -->

            <div class="md:w-1/2">
                <div class="card flex flex-col gap-5">
                    <div class="font-semibold text-2xl">Información General</div>

                    <!-- Código / Nombre -->

                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label class="required">Código</label>

                            <InputText v-model="form.code" class="w-full" />
                        </div>

                        <div class="flex flex-col grow basis-0 gap-2">
                            <label class="required">Nombre</label>

                            <InputText v-model="form.name" class="w-full" />
                        </div>
                    </div>

                    <!-- Descripción -->

                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col w-full gap-2">
                            <label>Descripción</label>

                            <Textarea v-model="form.description" rows="3" class="w-full" />
                        </div>
                    </div>

                    <!-- Categoría / Unidad -->

                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label class="required">Categoría</label>

                            <Dropdown v-model="form.productCategoryId" :options="categories" option-label="name" option-value="id" placeholder="Seleccione..." class="w-full" />
                        </div>

                        <div class="flex flex-col grow basis-0 gap-2">
                            <label class="required">Unidad</label>

                            <Dropdown v-model="form.unit" :options="units" option-label="label" option-value="value" class="w-full" />
                        </div>
                    </div>

                    <!-- Tipo Producto / Tipo Abastecimiento -->

                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label class="required">Tipo de Producto</label>

                            <Dropdown v-model="form.productType" :options="productTypes" option-label="label" option-value="value" class="w-full" />
                        </div>

                        <div v-if="form.productType !== 'SERVICE'" class="flex flex-col grow basis-0 gap-2">
                            <label class="required">¿Cómo obtiene este producto?</label>

                            <Dropdown v-model="form.sourceType" :options="sourceTypes" option-label="label" option-value="value" class="w-full" />
                        </div>
                    </div>

                    <!-- Código de barras -->

                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label>Código de Barras</label>

                            <InputText v-model="form.barcode" class="w-full" />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label class="required">Precio de Venta *</label>

                            <InputNumber v-model="form.salePrice" class="w-full" mode="currency" currency="BOB" locale="es-BO" :min="0" />

                            <small class="text-500">Precio utilizado en ventas.</small>
                        </div>
                    </div>

                    <!-- Imagen -->

                    <div class="flex flex-wrap gap-4">
                        <div class="md:w-2/3 text-center gap-2">
                            <div class="border-2 border-dashed border-300 border-round" style="height: 170px; display: flex; align-items: center; justify-content: center; cursor: pointer">
                                <div class="flex align-items-center gap-3">
                                    <i class="pi pi-upload" style="font-size: 2rem; color: #374151" />

                                    <div>
                                        <div class="font-medium">Arrastra la imagen o haz clic para seleccionar</div>

                                        <small class="text-500">JPG, PNG o WEBP. Máx. 2 MB</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col grow basis-0 gap-2">
                            <div class="border border-200 border-round flex w-full align-items-between justify-content-between overflow-hidden" style="height: 170px; display: flex; align-items: center; justify-content: center">
                                <img src="https://placehold.co/300x250?text=Preview" alt="Preview" style="max-width: 100%; max-height: 100%; object-fit: contain" />
                            </div>
                        </div>
                    </div>

                    <!-- Activo -->

                    <div class="flex flex-wrap gap-4">
                        <div class="flex align-items-center gap-3">
                            <ToggleSwitch v-model="form.isActive" />

                            <label>Producto Activo</label>
                        </div>
                    </div>
                </div>
            </div>

            <Divider layout="vertical" class="!hidden md:!flex" />

            <!-- ===================================================== -->
            <!-- COLUMNA DERECHA (Inventario y Costos)                 -->
            <!-- ===================================================== -->

            <div class="md:w-1/2">
                <div class="card flex flex-col gap-6">
                    <div v-if="form.sourceType === 'PURCHASE'">
                        <div>
                            <div class="font-semibold text-2xl">Inventario y Precios</div>
                            <div class="text-500 mt-2">Configura los niveles de inventario y los precios del producto.</div>
                        </div>

                        <!-- ===================================================== -->
                        <!-- INVENTARIO -->
                        <!-- ===================================================== -->

                        <div>
                            <div class="font-semibold text-xl mb-4">Inventario</div>

                            <div class="flex flex-wrap gap-4">
                                <div class="flex flex-col grow basis-0 gap-2">
                                    <label>Stock Mínimo</label>

                                    <InputNumber v-model="form.minStock" class="w-full" :min="0" />
                                </div>

                                <div class="flex flex-col grow basis-0 gap-2">
                                    <label>Stock Máximo</label>

                                    <InputNumber v-model="form.maxStock" class="w-full" :min="0" />
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-4 mt-4">
                                <div class="flex flex-col grow basis-0 gap-2">
                                    <label>Punto de Reposición</label>

                                    <InputNumber v-model="form.reorderPoint" class="w-full" :min="0" />

                                    <small class="text-500">Nivel para generar alerta de reposición.</small>
                                </div>

                                <div class="flex flex-col grow basis-0 gap-2">
                                    <label>Stock Actual</label>

                                    <InputNumber v-model="form.currentStock" class="w-full" disabled />

                                    <small class="text-500">Calculado automáticamente.</small>
                                </div>
                            </div>
                        </div>

                        <!-- ===================================================== -->
                        <!-- COSTOS -->
                        <!-- ===================================================== -->

                        <div>
                            <div class="font-semibold text-xl mb-4">Costos y Precios</div>

                            <div class="flex flex-wrap gap-4">
                                <div class="flex flex-col grow basis-0 gap-2">
                                    <label>Costo</label>

                                    <InputNumber v-model="form.costPrice" class="w-full" mode="currency" currency="BOB" locale="es-BO" disabled />

                                    <small class="text-500 mb-3">Se actualiza automáticamente desde Compras y Producción.</small>
                                </div>

                                <div class="flex flex-col grow basis-0 gap-2"></div>
                            </div>
                        </div>

                        <div class="flex align-items-center gap-2 mb-3">
                            <span class="font-semibold">Inventario</span>

                            <i v-tooltip.top="'El stock y el costo serán administrados automáticamente mediante los movimientos de inventario.'" class="pi pi-info-circle text-primary cursor-pointer" style="font-size: 1rem"></i>
                        </div>
                    </div>

                    <!-- ===================================================== -->
                    <!-- PRODUCCIÓN (BOM) -->
                    <!-- ===================================================== -->

                    <div v-if="form.productType === 'FINISHED_PRODUCT' && (form.sourceType === 'PRODUCTION' || form.sourceType === 'BOTH')">
                        <div class="flex align-items-center gap-2 mb-3">
                            <span class="font-semibold">Abastecimiento: PRODUCCIÓN</span>

                            <i v-tooltip.top="'Este producto será fabricado utilizando las materias primas definidas en esta Lista de Materiales (BOM).'" class="pi pi-info-circle text-primary cursor-pointer" style="font-size: 1rem"></i>
                        </div>
                        <div class="mt-4">
                            <div class="font-semibold text-2xl">Lista de Materiales (BOM)</div>

                            <div class="text-500 mt-2">Agregue las materias primas necesarias para fabricar este producto.</div>
                        </div>

                        <!-- ===================================================== -->
                        <!-- AGREGAR MATERIA PRIMA -->
                        <!-- ===================================================== -->

                        <div class="flex align-items-end gap-3 mt-5 mb-5">
                            <div class="flex-1">
                                <label class="block mb-2">Buscar Materia Prima</label>

                                <AutoComplete v-model="selectedMaterial" :suggestions="filteredMaterials" option-label="name" dropdown fluid placeholder="Buscar materia prima..." @complete="searchMaterials" />
                            </div>

                            <Button label="Agregar" class="mt-6" icon="pi pi-plus" severity="success" @click="addItem" />
                        </div>
                        <!-- ===================================================== -->
                        <!-- MATERIAS PRIMAS -->
                        <!-- ===================================================== -->

                        <DataTable :value="form.bom.items" striped-rows responsive-layout="scroll" class="mt-3" empty-message="No existen materias primas agregadas.">
                            <!-- Materia Prima -->

                            <Column header="Materia Prima" style="width: 40%">
                                <template #body="{ data }">
                                    <div class="flex flex-column">
                                        <span class="font-medium">
                                            {{ data.productName }}
                                        </span>

                                        <small class="text-500">
                                            {{ data.productCode }}
                                        </small>
                                    </div>
                                </template>
                            </Column>

                            <!-- Unidad -->

                            <Column header="Unidad" style="width: 10%">
                                <template #body="{ data }">
                                    {{ data.unit }}
                                </template>
                            </Column>

                            <!-- Cantidad -->

                            <Column header="Cantidad" style="width: 15%">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.quantity" :min="0.01" :min-fraction-digits="2" :max-fraction-digits="4" input-class="text-center" fluid />
                                </template>
                            </Column>

                            <!-- Costo Actual -->

                            <Column header="Costo Actual" style="width: 15%">
                                <template #body="{ data }">
                                    <span class="font-medium">Bs. {{ Number(data.unitCost ?? 0).toFixed(2) }}</span>
                                </template>
                            </Column>

                            <!-- Subtotal -->

                            <Column header="Subtotal" style="width: 15%">
                                <template #body="{ data }">
                                    <strong class="text-green-600">
                                        Bs.
                                        {{ (Number(data.quantity) * Number(data.unitCost)).toFixed(2) }}
                                    </strong>
                                </template>
                            </Column>

                            <!-- Acciones -->

                            <Column style="width: 70px">
                                <template #body="{ index }">
                                    <Button icon="pi pi-trash" severity="danger" text rounded @click="removeItem(index)" />
                                </template>
                            </Column>
                        </DataTable>
                        <!-- ===================================================== -->
                        <!-- RESUMEN DE COSTOS -->
                        <!-- ===================================================== -->

                        <div class="flex flex-wrap justify-between gap-4 mt-4">
                            <div class="flex-1 flex justify-center align-center">
                                <div class="cost-box">
                                    <span class="label">Costo de Producción</span>
                                    <br />
                                    <span class="text-green-600 text-3xl font-bold">Bs. {{ productionCost.toFixed(2) }}</span>
                                </div>
                            </div>

                            <div class="flex-1 flex justify-center align-center">
                                <div class="cost-box">
                                    <span class="label text-500">Gastos Indirectos (%)</span>
                                    <br />

                                    <InputNumber v-model="form.bom.indirectCostPercent" suffix="%" :min="0" :max="100" fluid />
                                </div>
                            </div>

                            <div class="flex-1 flex justify-center align-center">
                                <div class="cost-box">
                                    <span class="label text-500">Costo Total</span>
                                    <br />
                                    <span class="text-900 text-3xl font-bold">Bs. {{ totalProductionCost.toFixed(2) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- ===================================================== -->
                        <!-- INFORMACIÓN -->
                        <!-- ===================================================== -->

                        <div class="flex align-items-center gap-2">
                            <span class="font-semibold mt-2.5">Costos de Producción</span>

                            <Button icon="pi pi-info-circle text-primary" text rounded severity="secondary" class="p-0 w-2rem h-2rem" @click="toggleCostInfo" />
                            <Popover ref="costInfo">
                                <div class="w-22rem">
                                    <div class="text-lg font-semibold mb-3">Información sobre los costos</div>

                                    <p class="mb-3">
                                        El costo de producción se calcula utilizando el
                                        <strong>costo actual</strong>
                                        de cada materia prima.
                                    </p>

                                    <div class="font-semibold mb-2">Los costos se actualizan mediante:</div>

                                    <ul class="pl-3 m-0">
                                        <li>Inventario Inicial</li>
                                        <li>Compras</li>
                                        <li>Producción</li>
                                    </ul>
                                </div>
                            </Popover>
                        </div>
                    </div>
                    <!-- ===================================================== -->
                    <!-- SERVICIOS -->
                    <!-- ===================================================== -->

                    <div v-if="form.productType === 'SERVICE'">
                        <Divider />

                        <div class="flex flex-column justify-content-center align-items-center" style="min-height: 220px">
                            <i class="pi pi-briefcase text-6xl text-400 mb-4"></i>

                            <h2>Servicio</h2>

                            <p class="text-500 text-center">Los servicios no administran inventario ni requieren una lista de materiales.</p>
                        </div>
                    </div>
                </div>
                <!-- FIN COLUMNA DERECHA -->
            </div>
            <!-- FIN CONTENIDO -->
        </div>
        <template #footer>
            <div class="flex justify-end w-full">
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" class="mr-4" @click="visible = false" />

                <Button label="Guardar" icon="pi pi-check" severity="success" class="mr-12" @click="saveProduct" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
:deep(.product-dialog .p-dialog-title) {
    font-size: 1.6rem;
    font-weight: 700;
}

.required::after {
    content: ' *';
    color: #ef4444;
    font-weight: 700;
}
</style>
