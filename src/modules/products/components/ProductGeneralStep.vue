<script setup>
import ToggleSwitch from 'primevue/toggleswitch';
import { computed, reactive, watch } from 'vue';
import ProductBomStep from './ProductBomStep.vue';
import ProductInventoryStep from './ProductInventoryStep.vue';

const props = defineProps({
    form: {
        type: Object,
        required: true
    },
    categories: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:form']);

const localForm = reactive({});

watch(
    () => props.form,
    (value) => {
        Object.assign(localForm, value);
    },
    {
        immediate: true,
        deep: true
    }
);

watch(
    localForm,
    () => {
        emit('update:form', { ...localForm });
    },
    {
        deep: true
    }
);

/*
|--------------------------------------------------------------------------
| Catálogos
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Reglas del ERP
|--------------------------------------------------------------------------
*/

watch(
    () => localForm.productType,
    (type) => {
        if (type === 'SERVICE') {
            // Los servicios no se producen
            localForm.sourceType = 'PURCHASE';
            return;
        }

        if (!localForm.sourceType) {
            localForm.sourceType = 'PURCHASE';
        }
    },
    {
        immediate: true
    }
);

/*
|--------------------------------------------------------------------------
| UI
|--------------------------------------------------------------------------
*/

const showFulfillment = computed(() => {
    return localForm.productType !== 'SERVICE';
});

const panelMode = computed(() => {
    if (localForm.productType === 'SERVICE') {
        return 'SERVICE';
    }

    if (localForm.sourceType === 'PRODUCTION') {
        return 'BOM';
    }

    return 'STOCK';
});
</script>
<template>
    <div class="flex flex-col md:flex-row gap-8">
        <div class="md:w-1/2">
            <div class="card flex flex-col gap-5">
                <div class="font-semibold text-2xl">Información General</div>
                <div class="flex flex-wrap gap-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Código</label>
                        <InputText v-model="localForm.code" class="w-full" />
                    </div>
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Nombre</label>
                        <InputText v-model="localForm.name" class="w-full" />
                    </div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <label>Descripción</label>
                    <Textarea v-model="localForm.description" rows="3" class="w-full" />
                </div>
                <div class="flex flex-wrap gap-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Categoría</label>
                        <Dropdown v-model="localForm.productCategoryId" :options="props.categories" option-label="name" option-value="id" placeholder="Seleccione..." class="w-full" />
                    </div>
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Unidad</label>
                        <Dropdown v-model="localForm.unit" :options="units" option-label="label" option-value="value" class="w-full" />
                    </div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Tipo de Producto</label>
                        <Dropdown v-model="localForm.productType" :options="productTypes" option-label="label" option-value="value" class="w-full" />
                    </div>
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>¿Cómo obtiene este producto?</label>
                        <Dropdown v-if="showFulfillment" v-model="localForm.sourceType" :options="sourceTypes" option-label="label" option-value="value" class="w-full" />
                    </div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Código de Barras</label>
                        <InputText v-model="localForm.barcode" class="w-full" />
                    </div>
                    <!-- <div class="flex flex-col grow basis-0 gap-2">
                        <label>Marca</label>
                        <InputText v-model="localForm.brand" class="w-full" />
                    </div> -->
                </div>
                <div class="flex flex-wrap gap-4">
                    <!-- Subir Imagen -->
                    <div class="md:w-2/3 text-center gap-2">
                        <div class="border-2 border-dashed border-300 border-round" style="height: 170px; display: flex; align-items: center; justify-content: center; cursor: pointer">
                            <div class="flex align-items-center gap-3">
                                <i class="pi pi-upload" style="font-size: 2rem; color: #374151"></i>

                                <div>
                                    <div class="font-medium">Arrastra la imagen o haz clic para seleccionar</div>

                                    <small class="text-500">JPG, PNG o WEBP. Máx. 2 MB</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vista Previa -->
                    <div class="flex flex-col grow basis-0 gap-2">
                        <div class="border border-200 border-round flex w-full align-items-between justify-content-between overflow-hidden" style="height: 170px; display: flex; align-items: center; justify-content: center; cursor: pointer">
                            <img src="https://placehold.co/300x250?text=Preview" alt="Preview" style="max-width: 100%; max-height: 100%; object-fit: contain" />
                        </div>
                    </div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div class="flex align-items-center gap-3">
                        <ToggleSwitch v-model="localForm.isActive" />
                        <label>Producto Activo</label>
                    </div>
                </div>
            </div>
        </div>
        <Divider layout="vertical" class="!hidden md:!flex"></Divider>
        <ProductInventoryStep v-if="panelMode === 'STOCK'" :form="localForm" preview />

        <ProductBomStep v-else-if="panelMode === 'BOM'" :form="localForm" preview />
        <div v-else class="md:w-1/2">
            <div class="card flex flex-column justify-content-center align-items-center h-full">
                <i class="pi pi-briefcase text-6xl text-400 mb-4"></i>

                <h2>Servicio</h2>

                <p class="text-500 text-center">Los servicios no administran inventario ni requieren una lista de materiales.</p>
            </div>
        </div>
    </div>
</template>
