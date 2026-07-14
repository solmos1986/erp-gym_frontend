<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import ProductCategoryService from '../../../service/productCategory.service';
import { useAuthStore } from '../../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const categories = ref([]);

const loading = ref(false);
const dialogVisible = ref(false);
const editingCategory = ref(null);

const form = ref({
    name: '',
    description: ''
});

// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_PRODUCT_CATEGORIES_VIEW'));

const canCreate = computed(() => auth.can('TENANT_PRODUCT_CATEGORIES_CREATE'));

const canUpdate = computed(() => auth.can('TENANT_PRODUCT_CATEGORIES_EDIT'));

const canDelete = computed(() => auth.can('TENANT_PRODUCT_CATEGORIES_DELETE'));

// =====================
// CARGAS
// =====================
async function loadCategories() {
    loading.value = true;

    try {
        categories.value = await ProductCategoryService.getAll();
    } finally {
        loading.value = false;
    }
}

// =====================
// CRUD
// =====================
function openCreate() {
    editingCategory.value = null;

    form.value = {
        name: '',
        description: ''
    };

    dialogVisible.value = true;
}

function openEdit(category) {
    editingCategory.value = category;

    form.value = {
        name: category.name,
        description: category.description
    };

    dialogVisible.value = true;
}

async function activate(row) {
    try {
        await ProductCategoryService.activate(row.id);

        toast.add({
            severity: 'success',
            summary: 'Categoría activada',
            life: 3000
        });

        await loadCategories();
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: 'Error al activar',
            life: 3000
        });
    }
}

async function save() {
    try {
        if (!form.value.name) {
            toast.add({
                severity: 'warn',
                summary: 'El nombre es obligatorio',
                life: 3000
            });

            return;
        }

        if (editingCategory.value) {
            await ProductCategoryService.update(editingCategory.value.id, form.value);

            toast.add({
                severity: 'success',
                summary: 'Categoría actualizada',
                life: 3000
            });
        } else {
            await ProductCategoryService.create(form.value);

            toast.add({
                severity: 'success',
                summary: 'Categoría creada',
                life: 3000
            });
        }

        dialogVisible.value = false;

        await loadCategories();
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: 'Error al guardar categoría',
            life: 3000
        });
    }
}

async function remove(category) {
    if (!confirm(`¿Desactivar categoría ${category.name}?`)) {
        return;
    }

    try {
        await ProductCategoryService.remove(category.id);

        toast.add({
            severity: 'success',
            summary: 'Categoría desactivada',
            life: 3000
        });

        await loadCategories();
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: e?.response?.data?.message || 'Error al desactivar',
            life: 3000
        });
    }
}

// =====================
// INIT
// =====================
onMounted(async () => {
    await loadCategories();
});
</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button v-if="canCreate" label="Nueva Categoría" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openCreate" />
            </template>
        </Toolbar>

        <div class="flex justify-content-between mb-3">
            <h3>Categorías de Productos</h3>
        </div>

        <DataTable v-if="canView" :value="categories" :loading="loading">
            <Column field="name" header="Nombre" />

            <Column field="description" header="Descripción" />

            <Column header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.isActive ? 'Activo' : 'Inactivo'" :severity="data.isActive ? 'success' : 'danger'" />
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="{ data }">
                    <Button v-if="canUpdate" icon="pi pi-pencil" text @click="openEdit(data)" />

                    <Button v-if="data.isActive && canDelete" icon="pi pi-trash" text severity="danger" @click="remove(data)" />

                    <Button v-if="!data.isActive && canUpdate" icon="pi pi-refresh" text severity="success" @click="activate(data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dialogVisible" modal header="Categoría" style="width: 400px">
            <div class="field">
                <label>Nombre</label>
                <InputText v-model="form.name" class="w-full" />
            </div>

            <div class="field">
                <label>Descripción</label>
                <InputText v-model="form.description" class="w-full" />
            </div>

            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />

                <Button label="Guardar" severity="success" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
