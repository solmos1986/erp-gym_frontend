<template>
    <div class="grid">
        <!-- Filtros -->
        <div class="col-12">
            <div class="card">
                <h5>{{ title }}</h5>

                <div class="grid">
                    <div class="col-12 md:col-3">
                        <label class="block mb-2">Desde</label>

                        <Calendar v-model="filters.from" date-format="yy-mm-dd" show-icon class="w-full" />
                    </div>

                    <div class="col-12 md:col-3">
                        <label class="block mb-2">Hasta</label>

                        <Calendar v-model="filters.to" date-format="yy-mm-dd" show-icon class="w-full" />
                    </div>

                    <div class="col-12 md:col-3">
                        <label class="block mb-2">Sucursal</label>

                        <Dropdown v-model="filters.branchId" :options="branches" option-label="name" option-value="id" placeholder="Todas" class="w-full" />
                    </div>

                    <div class="col-12 md:col-3 flex align-items-end">
                        <Button label="Buscar" icon="pi pi-search" @click="search" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabla -->

        <div class="col-12">
            <div class="card">
                <DataTable :value="rows" responsive-layout="scroll" :loading="loading">
                    <Column v-for="col in columns" :key="col.field" :field="col.field" :header="col.header" />
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive } from 'vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },

    columns: {
        type: Array,
        default: () => []
    },

    rows: {
        type: Array,
        default: () => []
    },

    branches: {
        type: Array,
        default: () => []
    },

    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['search']);

const filters = reactive({
    from: null,
    to: null,
    branchId: null
});

function search() {
    emit('search', {
        ...filters
    });
}
</script>
