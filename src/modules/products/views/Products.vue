<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import ProductService from '@/modules/products/services/product.service';
import ProductCategoryService from '@/service/productCategory.service';
import { useAuthStore } from '@/store/auth.store';

import ProductDialog from '../components/ProductDialog.vue';

const toast = useToast();
const auth = useAuthStore();

const loading = ref(false);

const products = ref([]);
const categories = ref([]);
const materials = ref([]);

const dialogVisible = ref(false);
const editingProduct = ref(null);

const canView = computed(() => auth.can('TENANT_PRODUCTS_VIEW'));
const canCreate = computed(() => auth.can('TENANT_PRODUCTS_CREATE'));
const canUpdate = computed(() => auth.can('TENANT_PRODUCTS_EDIT'));
const canDelete = computed(() => auth.can('TENANT_PRODUCTS_DELETE'));

async function loadProducts() {
    loading.value = true;

    try {
        products.value = await ProductService.getAll();
    } finally {
        loading.value = false;
    }
}

async function loadMaterials() {
    materials.value = await ProductService.getAll({
        productType: 'RAW_MATERIAL',
        isActive: true
    });
}

async function loadCategories() {
    categories.value = await ProductCategoryService.getAll({
        isActive: true
    });
}

async function openCreate() {
    await loadMaterials();

    editingProduct.value = null;
    dialogVisible.value = true;
}

async function openEdit(product) {
    console.log('editing product');

    await loadMaterials();

    editingProduct.value = { ...product };
    dialogVisible.value = true;
}

async function save(form) {
    try {
        if (!form.product?.name) {
            toast.add({
                severity: 'warn',
                summary: 'Nombre requerido',
                life: 3000
            });
            return;
        }

        if (editingProduct.value) {
            await ProductService.update(editingProduct.value.id, form);

            toast.add({
                severity: 'success',
                summary: 'Producto actualizado',
                life: 3000
            });
        } else {
            console.log('========== FORM ==========');
            console.log(form);
            console.log(JSON.stringify(form, null, 2));
            await ProductService.create(form);

            toast.add({
                severity: 'success',
                summary: 'Producto creado',
                life: 3000
            });
        }

        dialogVisible.value = false;

        await loadProducts();
    } catch (error) {
        console.error(error);

        toast.add({
            severity: 'error',
            summary: error?.response?.data?.message || 'Error guardando producto',
            life: 3000
        });
    }
}

async function remove(product) {
    if (!confirm(`¿Desactivar ${product.name}?`)) {
        return;
    }

    try {
        await ProductService.remove(product.id);

        toast.add({
            severity: 'success',
            summary: 'Producto desactivado',
            life: 3000
        });

        await loadProducts();
    } catch (error) {
        console.error(error);
    }
}

async function activate(product) {
    try {
        await ProductService.activate(product.id);

        toast.add({
            severity: 'success',
            summary: 'Producto activado',
            life: 3000
        });

        await loadProducts();
    } catch (error) {
        console.error(error);
    }
}

onMounted(async () => {
    await Promise.all([loadProducts(), loadCategories(), loadMaterials()]);
});
</script>

<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template #start>
                <Button v-if="canCreate" label="Nuevo Producto" icon="pi pi-plus" @click="openCreate" />
            </template>
        </Toolbar>

        <DataTable v-if="canView" :value="products" :loading="loading">
            <Column field="code" header="Código" />

            <Column field="name" header="Nombre" />

            <Column header="Categoría">
                <template #body="{ data }">
                    {{ data.category?.name }}
                </template>
            </Column>

            <Column field="productType" header="Tipo" />

            <Column field="salePrice" header="Precio Venta" />

            <Column header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.isActive ? 'Activo' : 'Inactivo'" :severity="data.isActive ? 'success' : 'danger'" />
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="{ data }">
                    <Button v-if="canUpdate" icon="pi pi-pencil" text @click="openEdit(data)" />

                    <Button v-if="data.isActive && canDelete" icon="pi pi-trash" severity="danger" text @click="remove(data)" />

                    <Button v-if="!data.isActive" icon="pi pi-refresh" severity="success" text @click="activate(data)" />
                </template>
            </Column>
        </DataTable>
    </div>
    <ProductDialog v-model:visible="dialogVisible" :editing-product="editingProduct" :categories="categories" :materials="materials" @save="save" />
</template>
