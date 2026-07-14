<script setup>
import { ref, watch } from 'vue';

import ProductGeneralStep from './ProductGeneralStep.vue';

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

const defaultForm = () => ({
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
});

const form = ref(defaultForm());

watch(
    () => visible.value,
    (show) => {
        if (!show) {
            form.value = defaultForm();
            return;
        }

        if (props.editingProduct) {
            form.value = structuredClone({
                ...defaultForm(),
                ...props.editingProduct
            });
        } else {
            form.value = defaultForm();
        }
    },
    {
        immediate: true
    }
);

function saveProduct() {
    emit('save', { ...form.value });
}
</script>

<template>
    <Dialog v-model:visible="visible" modal :style="{ width: '95vw', maxWidth: '1700px' }" :header="editingProduct ? 'Editar Producto' : 'Nuevo Producto'" class="product-dialog">
        <ProductGeneralStep :form="form" :categories="categories" />

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
