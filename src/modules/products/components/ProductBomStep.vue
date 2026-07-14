<script setup>
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
    form: {
        type: Object,
        required: true
    },
    preview: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:form']);

const localForm = reactive({});

const selectedMaterial = ref(null);

watch(
    () => props.form,
    (value) => {
        Object.assign(localForm, value);

        if (!localForm.bomItems) {
            localForm.bomItems = [];
        }
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

const productionCost = computed(() => {
    return (localForm.bomItems || []).reduce((total, item) => {
        return total + Number(item.quantity || 0) * Number(item.unitCost || 0);
    }, 0);
});

const indirectCost = computed(() => {
    return Number(localForm.indirectCostPercent || 0);
});

const totalProductionCost = computed(() => {
    return productionCost.value * (1 + indirectCost.value / 100);
});

function addItem() {
    localForm.bomItems.push({
        productId: null,
        productCode: '',
        productName: '',
        quantity: 1,
        unit: '',
        unitCost: 0,
        wastePercent: 0
    });

    selectedMaterial.value = null;
}

function removeItem(index) {
    localForm.bomItems.splice(index, 1);
}
</script>

<template>
    <div class="md:w-1/2 mt-10 mr-3">
        <div :class="[preview ? '' : 'card', 'flex flex-col gap-6']">
            <Message severity="success" :closable="false">
                <div class="flex align-items-start gap-3">
                    <i class="pi pi-box text-2xl"></i>

                    <div>
                        <div class="font-semibold mt-1.5">Abastecimiento: PRODUCCIÓN</div>

                        <div class="mt-1">Este producto se prepara cuando se vende. Defina los ingredientes y cantidades que se utilizarán en la producción (BOM).</div>
                    </div>
                </div>
            </Message>
            <div>
                <div class="font-semibold text-2xl">Receta de Produccion (BOM)</div>
                <div class="text-500 mt-2">Agregue las materias primas necesarias para fabricar este producto.</div>
            </div>

            <div class="flex align-items-end gap-3 mb-5">
                <div class="flex-1">
                    <AutoComplete v-model="selectedMaterial" :suggestions="[]" fluid field="name" placeholder="Buscar materia prima para agregar..." class="w-full" />
                </div>

                <Button label="Agregar" icon="pi pi-plus" @click="addItem" />
            </div>
            <div class="flex flex-wrap flex-col gap-4">
                <DataTable :value="localForm.bomItems" striped-rows responsive-layout="scroll" class="mt-3">
                    <Column header="Producto" style="width: 40%">
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

                    <Column header="Unidad" style="width: 12%">
                        <template #body="{ data }">
                            {{ data.unit }}
                        </template>
                    </Column>

                    <Column header="Cantidad" style="width: 15%">
                        <template #body="{ data }">
                            <InputNumber v-model="data.quantity" :min="0" :min-fraction-digits="2" :max-fraction-digits="2" input-class="text-center" class="w-full" />
                        </template>
                    </Column>

                    <Column header="Costo Unit." style="width: 15%">
                        <template #body="{ data }">
                            {{ data.unitCost?.toFixed(2) }}
                        </template>
                    </Column>

                    <Column header="Costo Total" style="width: 15%">
                        <template #body="{ data }">
                            <strong>
                                {{ (data.quantity * data.unitCost).toFixed(2) }}
                            </strong>
                        </template>
                    </Column>

                    <Column style="width: 70px">
                        <template #body="{ index }">
                            <Button icon="pi pi-trash" severity="danger" text rounded @click="removeItem(index)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
            <div class="flex flex-wrap justify-between gap-4 mt-4">
                <div class="flex-1 flex justify-center align-center">
                    <div class="cost-box">
                        <span class="label">Costo de Producción</span>
                        <br />
                        <span class="text-green-600 text-4xl font-bold">Bs. {{ productionCost.toFixed(2) }}</span>
                    </div>
                </div>

                <div class="flex-1 flex justify-center align-center">
                    <div class="cost-box">
                        <span class="label text-500">Gastos Indirectos (%)</span>
                        <br />

                        <InputNumber v-model="localForm.indirectCostPercent" class="-mt-0.8" suffix="%" />
                    </div>
                </div>

                <div class="flex-1 flex justify-center align-center">
                    <div class="cost-box">
                        <span class="label text-500">Costo Total</span>
                        <br />
                        <span class="text-900 text-4xl font-bold">Bs. {{ totalProductionCost.toFixed(2) }}</span>
                    </div>
                </div>
            </div>
            <Message severity="info" :closable="false">
                <div class="flex align-items-start gap-3">
                    <i class="pi pi-info-circle text-2xl"></i>

                    <div>
                        <div class="mt-1.5">Este costo se calcula en base al costo actual de los ingredientes. Puede variar según los precios de compra.</div>
                    </div>
                </div>
            </Message>
        </div>
    </div>
</template>
