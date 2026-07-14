<script setup>
import ToggleSwitch from 'primevue/toggleswitch';
import { reactive, watch } from 'vue';
const visible = defineModel('visible');

const emit = defineEmits(['save']);

const props = defineProps({
    categories: {
        type: Array,
        default: () => []
    },
    editingProduct: {
        type: Object,
        default: null
    }
});

function defaultForm() {
    return {
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

        bomItems: [],
        indirectCostPercent: 0
    };
}

const form = reactive(defaultForm());

watch(
    () => props.editingProduct,
    (product) => {
        if (product) {
            Object.assign(form, defaultForm(), product);
        }
    },
    {
        immediate: true
    }
);

watch(
    () => visible.value,
    (show) => {
        if (!show) {
            Object.assign(form, defaultForm());
        }
    }
);

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

function saveProduct() {
    emit('save', {
        ...form
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
                            <label>Código</label>

                            <InputText v-model="form.code" class="w-full" />
                        </div>

                        <div class="flex flex-col grow basis-0 gap-2">
                            <label>Nombre</label>

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
                            <label>Categoría</label>

                            <Dropdown v-model="form.productCategoryId" :options="categories" option-label="name" option-value="id" placeholder="Seleccione..." class="w-full" />
                        </div>

                        <div class="flex flex-col grow basis-0 gap-2">
                            <label>Unidad</label>

                            <Dropdown v-model="form.unit" :options="units" option-label="label" option-value="value" class="w-full" />
                        </div>
                    </div>

                    <!-- Tipo Producto / Tipo Abastecimiento -->

                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label>Tipo de Producto</label>

                            <Dropdown v-model="form.productType" :options="productTypes" option-label="label" option-value="value" class="w-full" />
                        </div>

                        <div v-if="form.productType !== 'SERVICE'" class="flex flex-col grow basis-0 gap-2">
                            <label>¿Cómo obtiene este producto?</label>

                            <Dropdown v-model="form.sourceType" :options="sourceTypes" option-label="label" option-value="value" class="w-full" />
                        </div>
                    </div>

                    <!-- Código de barras -->

                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label>Código de Barras</label>

                            <InputText v-model="form.barcode" class="w-full" />
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

                                <small class="text-500">Se actualiza automáticamente desde Compras y Producción.</small>
                            </div>

                            <div class="flex flex-col grow basis-0 gap-2">
                                <label>Precio de Venta *</label>

                                <InputNumber v-model="form.salePrice" class="w-full" mode="currency" currency="BOB" locale="es-BO" :min="0" />

                                <small class="text-500">Precio utilizado en ventas.</small>
                            </div>
                        </div>
                    </div>

                    <Message severity="info" :closable="false">
                        <strong>Importante</strong>

                        <br />

                        El stock y el costo serán administrados automáticamente mediante los movimientos de inventario.
                    </Message>
                    <!-- ===================================================== -->
                    <!-- PRODUCCIÓN (BOM) -->
                    <!-- ===================================================== -->

                    <div v-if="form.productType !== 'SERVICE' && (form.sourceType === 'PRODUCTION' || form.sourceType === 'BOTH')">
                        <div class="font-semibold text-2xl mb-4">Lista de Materiales (BOM)</div>

                        <Message severity="warn" :closable="false">
                            <strong>Módulo en construcción</strong>

                            <br />

                            Aquí se configurará la receta o Lista de Materiales (BOM) utilizada por Producción.
                        </Message>

                        <!--
                                Próximamente:

                                DataTable de Materias Primas

                                + Agregar Material
                                + Cantidad
                                + Unidad
                                + Merma
                                + Costo
                                + Rendimiento
                                + Costos Indirectos

                            -->
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
</style>
