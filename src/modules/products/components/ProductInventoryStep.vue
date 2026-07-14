<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
    localForm: {
        type: Object,
        required: true
    },
    preview: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:localForm']);

const locallocalForm = reactive({});

watch(
    () => props.localForm,
    (value) => {
        Object.assign(locallocalForm, value);
    },
    {
        immediate: true,
        deep: true
    }
);

watch(
    locallocalForm,
    () => {
        emit('update:localForm', { ...locallocalForm });
    },
    {
        deep: true
    }
);

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
</script>

<template>
    <!-- <div class="flex flex-col md:flex-row gap-8"> -->
    <div class="md:w-1/2 mt-10 mr-3">
        <div :class="[preview ? '' : 'card', 'flex flex-col gap-6']">
            <div>
                <div class="font-semibold text-2xl">Inventario y Precios</div>
                <div class="text-500 mt-2">Configura los niveles de inventario y los precios del producto.</div>
            </div>
            <div>
                <div class="font-semibold text-xl mb-4">Inventario</div>

                <div class="flex flex-wrap gap-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Stock Mínimo *</label>

                        <InputNumber v-model="localForm.minStock" class="w-full" :min="0" />
                    </div>

                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Stock Máximo</label>

                        <InputNumber v-model="localForm.maxStock" class="w-full" :min="0" />
                    </div>
                </div>

                <div class="flex flex-wrap gap-4 mt-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Punto de Reorden</label>

                        <InputNumber v-model="localForm.reorderPoint" class="w-full" :min="0" />

                        <small class="text-500">Nivel para generar alerta de reposición.</small>
                    </div>

                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Unidad</label>

                        <Dropdown v-model="localForm.unit" :options="units" option-label="label" option-value="value" class="w-full" />
                    </div>
                </div>
            </div>

            <div>
                <div class="font-semibold text-xl mb-4">Costos y Precios</div>

                <div class="flex flex-wrap gap-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Precio de Venta *</label>

                        <InputNumber v-model="localForm.salePrice" class="w-full" mode="currency" currency="BOB" locale="es-BO" />

                        <small class="text-500">Puede calcularse automáticamente.</small>
                    </div>

                    <div class="flex flex-col grow basis-0 gap-2">
                        <label>Costo Promedio</label>

                        <InputNumber v-model="localForm.costPrice" class="w-full" mode="currency" currency="BOB" locale="es-BO" disabled />

                        <small class="text-500">Calculado automáticamente.</small>
                    </div>
                </div>
            </div>

            <Message severity="info" :closable="false">
                <strong>Importante</strong>

                <br />

                Configure los valores iniciales del producto. Posteriormente el costo promedio y el stock serán administrados automáticamente por los movimientos de inventario.
            </Message>
        </div>
    </div>
    <!-- </div> -->
</template>
