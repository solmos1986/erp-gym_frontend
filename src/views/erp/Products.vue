<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import brandService from '../../service/brand.service';
import categoryService from '../../service/category.service';
import enumsService from '../../service/enums.service';
import productErpService from '../../service/product.service';
import subcategoryService from '../../service/subcategory.service';
import typeService from '../../service/type.service';
import { useAuthStore } from '../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// ================== ESTADOS PRINCIPALES ==================
const products = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingProduct = ref(null);

const types = ref([]);
const categories = ref([]);
const subCategories = ref([]);
const brands = ref([]);
const enums = ref([]);
const selectedImage = ref(null);
const imagePreview = ref(null);
const submitted = ref(false);

// ================== FORM PRODUCTO ==================
const form = ref({
    name: '',
    sku: '',
    purchasePrice: 0,
    salePrice: 0,
    productType: 'PRODUCT',
    typeId: null,
    categoryId: null,
    subcategoryId: null,
    brandId: null,
    description: '',
    stock: 0
});
// ========= VALIDACIONES  ==========

const isFormValid = computed(() => {
    return form.value.sku && form.value.name && form.value.productType && form.value.typeId && form.value.categoryId && form.value.salePrice > 0;
});
function isInvalid(field) {
    return submitted.value && !form.value[field];
}
function isInvalidPrice() {
    return submitted.value && (!form.value.salePrice || form.value.salePrice <= 0);
}

// ================== PERMISOS ==================
const canView = computed(() => auth.can('ERP_PRODUCTS_VIEW'));
const canCreate = computed(() => auth.can('ERP_PRODUCTS_CREATE'));
const canUpdate = computed(() => auth.can('ERP_PRODUCTS_EDIT'));
const canDelete = computed(() => auth.can('ERP_PRODUCTS_DELETE'));

// ================== MODALES SECUNDARIOS ==================
const showTypeModal = ref(false);
const showCategoryModal = ref(false);
const showSubCategoryModal = ref(false);
const showBrandModal = ref(false);

const typeForm = ref({ name: '' });
const categoryForm = ref({ name: '' });
const subCategoryForm = ref({ name: '' });
const brandForm = ref({ name: '' });

// ================== CARGA INICIAL ==================
async function loadProducts() {
    loading.value = true;
    try {
        types.value = await typeService.getAll();
        brands.value = await brandService.getAll();
        enums.value = await enumsService.getProductTypes();
        products.value = await productErpService.getAll();
    } finally {
        loading.value = false;
    }
}

onMounted(loadProducts);

// ================== CARGAS DEPENDIENTES ==================
watch(
    () => form.value.typeId,
    async (newTypeId) => {
        if (!newTypeId) {
            categories.value = [];
            form.value.categoryId = null;
            return;
        }
        categories.value = await categoryService.getAll(newTypeId);
    }
);

watch(
    () => form.value.categoryId,
    async (newCategoryId) => {
        if (!newCategoryId) {
            subCategories.value = [];
            form.value.subcategoryId = null;
            return;
        }
        subCategories.value = await subcategoryService.getByCategory(newCategoryId);
    }
);

// ================== CRUD PRODUCTO ==================
function openCreate() {
    submitted.value = false;
    editingProduct.value = null;
    form.value = {
        name: '',
        sku: '',
        purchasePrice: 0,
        salePrice: 0,
        productType: '',
        typeId: null,
        categoryId: null,
        subcategoryId: null,
        brandId: null,
        description: 'Description',
        stock: 0
    };
    dialogVisible.value = true;
}

function openEdit(product) {
    submitted.value = false;
    editingProduct.value = product;
    form.value = { ...product };

    if (product.imageUrl) {
        imagePreview.value = `${import.meta.env.VITE_API_URL}${product.imageUrl}`;
    } else {
        imagePreview.value = null;
    }

    selectedImage.value = null;
    dialogVisible.value = true;
}

async function save() {
    submitted.value = true;

    try {
        let savedProduct;

        if (editingProduct.value) {
            savedProduct = await productErpService.update(editingProduct.value.id, form.value);
            toast.add({ severity: 'success', summary: 'Producto actualizado', life: 3000 });
        } else {
            savedProduct = await productErpService.create(form.value);
            toast.add({ severity: 'success', summary: 'Producto creado', life: 3000 });
        }

        // 🔥 SUBIR IMAGEN SI EXISTE
        if (selectedImage.value && savedProduct?.id) {
            const res = await productErpService.uploadImage(savedProduct.id, selectedImage.value);
            imagePreview.value = `${import.meta.env.VITE_API_URL}${res.imageUrl}`;
            toast.add({ severity: 'success', summary: 'Imagen subida correctamente', life: 3000 });
        }

        // limpiar imagen
        selectedImage.value = null;
        imagePreview.value = null;

        dialogVisible.value = false;
        loadProducts();
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error al guardar el producto', life: 3000 });
    }
}

async function remove(product) {
    if (!confirm(`¿Eliminar el producto ${product.name}?`)) return;
    await productErpService.remove(product.id);
    toast.add({ severity: 'success', summary: 'Producto eliminado', life: 3000 });
    loadProducts();
}

// ================== CRUD MODALES SECUNDARIOS ==================
async function saveType() {
    const newType = await typeService.create(typeForm.value);
    types.value = await typeService.getAll();
    form.value.typeId = newType.id;
    showTypeModal.value = false;
    typeForm.value.name = '';
}

async function saveCategory() {
    const newCategory = await categoryService.create({
        name: categoryForm.value.name,
        typeId: form.value.typeId
    });
    categories.value = await categoryService.getAll(form.value.typeId);
    form.value.categoryId = newCategory.id;
    showCategoryModal.value = false;
    categoryForm.value.name = '';
}

async function saveSubCategory() {
    const newSub = await subcategoryService.create({
        name: subCategoryForm.value.name,
        categoryId: form.value.categoryId
    });
    subCategories.value = await subcategoryService.getByCategory(form.value.categoryId);
    form.value.subcategoryId = newSub.id;
    showSubCategoryModal.value = false;
    subCategoryForm.value.name = '';
}

async function saveBrand() {
    const newBrand = await brandService.create(brandForm.value);
    brands.value = await brandService.getAll();
    form.value.brandId = newBrand.id;
    showBrandModal.value = false;
    brandForm.value.name = '';
}

// ============== IMAGENES =================
function onImageSelect(event) {
    const file = event.files[0]; // 👈 así funciona en PrimeVue
    if (!file) return;

    selectedImage.value = file;
    imagePreview.value = URL.createObjectURL(file);
}
async function removeImage() {
    if (!editingProduct.value) {
        // Si todavía no existe el producto, solo limpia frontend
        selectedImage.value = null;
        imagePreview.value = null;
        return;
    }

    try {
        await productErpService.deleteImage(editingProduct.value.id);

        selectedImage.value = null;
        imagePreview.value = null;

        toast.add({
            severity: 'success',
            summary: 'Imagen eliminada',
            life: 3000
        });
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'No se pudo eliminar la imagen',
            life: 3000
        });
    }
}
</script>

<template>
    <div class="card">
        <!-- HEADER -->
        <Toolbar class="mb-6">
            <template #start>
                <!-- <Dropdown v-model="selectedCompany" :options="companies" optionLabel="name" optionValue="id" placeholder="Seleccionar Empresa" class="mr-2" @change="loadProducts" /> -->
                <Button label="Nuevo Producto" v-if="canCreate" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openCreate" />
            </template>

            <template #end>
                <!-- <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" /> -->
            </template>
        </Toolbar>

        <div class="flex justify-content-between mb-3">
            <h3>Productos</h3>
        </div>

        <!-- LISTADO -->
        <DataTable
            v-if="canView"
            :value="products"
            :loading="loading"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rows="20"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
        >
            <Column field="name" header="Producto" sortable style="min-width: 12rem" />
            <Column field="sku" header="SKU" sortable style="min-width: 12rem" />
            <Column field="productType" header="Tipo" sortable style="min-width: 12rem" />
            <Column field="category.name" header="Categoria" sortable style="min-width: 12rem" />
            <Column field="subcategory.name" header="Sub-Categoria" sortable style="min-width: 12rem" />
            <!-- <Column field="stock" header="Stock" sortable style="min-width: 12rem" /> -->

            <Column header="Acciones" style="width: 12rem">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" v-if="canUpdate" @click="openEdit(data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" v-if="canDelete" @click="remove(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- Mensaje cuando no hay productos -->
        <div v-if="selectedCompany && products.length === 0 && !loading" class="text-center text-gray-600">
            <p>Selecciona una empresa para ver los productos disponibles.</p>
        </div>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="DETALLES DEL PRODUCTO" :style="{ width: '900px' }">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- COLUMNA IZQUIERDA -->
                <div class="space-y-6">
                    <!-- DATOS BÁSICOS -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block font-medium mb-1">SKU</label>
                            <InputText v-model="form.sku" :class="{ 'p-invalid': isInvalid('sku') }" class="w-full" />
                            <small v-if="isInvalid('sku')" class="p-error">SKU es obligatorio</small>
                        </div>

                        <div>
                            <label class="block font-medium mb-1">Tipo producto</label>
                            <InputGroup><Dropdown v-model="form.productType" :options="enums" optionLabel="label" :class="{ 'p-invalid': isInvalid('productType') }" optionValue="value" placeholder="Seleccionar tipo" class="mr-2" /></InputGroup>
                            <small v-if="isInvalid('productType')" class="p-error"> Debe seleccionar un tipo de producto </small>
                        </div>
                    </div>

                    <div>
                        <label class="block font-medium mb-1">Nombre</label>
                        <InputText v-model="form.name" :class="{ 'p-invalid': isInvalid('name') }" class="w-full" />
                        <small v-if="isInvalid('name')" class="p-error">Nombre es obligatorio</small>
                    </div>

                    <!-- PRECIOS -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block font-medium mb-1">Precio compra</label>
                            <InputText v-model="form.purchasePrice" type="number" class="w-full" />
                        </div>

                        <div>
                            <label class="block font-medium mb-1">Precio venta</label>
                            <InputText v-model="form.salePrice" type="number" :class="{ 'p-invalid': isInvalidPrice() }" class="w-full" />
                            <small v-if="isInvalidPrice()" class="p-error"> Precio de venta debe ser mayor a 0 </small><small v-if="!form.salePrice || form.salePrice <= 0" class="p-error"> Precio de venta debe ser mayor a 0 </small>
                        </div>
                    </div>

                    <!-- CLASIFICACIÓN -->
                    <div class="mt-2">
                        <h6 class="font-semibold text-gray-700 mb-2">CLASIFICACION</h6>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <label class="block font-medium mb-1">Clasificacion</label>
                                <InputGroup>
                                    <Button label="+" @click="showTypeModal = true" />
                                    <Dropdown v-model="form.typeId" :class="{ 'p-invalid': isInvalid('typeId') }" :options="types" optionLabel="name" optionValue="id" />
                                </InputGroup>
                                <small v-if="isInvalid('typeId')" class="p-error"> Debe seleccionar un tipo </small>
                            </div>

                            <div>
                                <label class="block font-medium mb-1">Categoría</label>
                                <InputGroup>
                                    <Button label="+" :disabled="!form.typeId" @click="showCategoryModal = true" />
                                    <Dropdown v-model="form.categoryId" :class="{ 'p-invalid': isInvalid('categoryId') }" :disabled="!form.typeId" :options="categories" optionLabel="name" optionValue="id" />
                                </InputGroup>
                                <small v-if="isInvalid('categoryId')" class="p-error"> Debe seleccionar una categoría </small>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-medium mb-1">Subcategoría</label>
                                <InputGroup>
                                    <Button label="+" :disabled="!form.categoryId" @click="showSubCategoryModal = true" />
                                    <Dropdown v-model="form.subcategoryId" :disabled="!form.categoryId" :options="subCategories" optionLabel="name" optionValue="id" />
                                </InputGroup>
                            </div>

                            <div>
                                <label class="block font-medium mb-1">Marca</label>
                                <InputGroup>
                                    <Button label="+" @click="showBrandModal = true" />
                                    <Dropdown v-model="form.brandId" :options="brands" optionLabel="name" optionValue="id" />
                                </InputGroup>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- COLUMNA DERECHA → IMAGEN -->
                <div class="flex justify-center">
                    <div class="flex flex-col items-center">
                        <h6 class="block font-semibold mb-3">Imagen del producto</h6>

                        <!-- CONTENEDOR FIJO DE LA IMAGEN -->
                        <div class="w-56 h-56 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 mb-3">
                            <img v-if="imagePreview" :src="imagePreview" class="max-w-full max-h-full object-contain" />
                            <span v-else class="text-gray-400 text-sm">Sin imagen</span>
                        </div>

                        <!-- BOTONES -->
                        <div class="flex items-center gap-3">
                            <FileUpload mode="basic" name="image" accept="image/*" chooseLabel="Elegir imagen" @select="onImageSelect" customUpload />

                            <Button v-if="imagePreview" label="Quitar" icon="pi pi-times" severity="danger" text @click="removeImage" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-end gap-6">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" :disa:disabled="(editingProduct ? !canUpdate : !canCreate) || !isFormValid" @click="save" />
            </div>
        </Dialog>
        <!-- MODALES SECUNDARIOS -->
        <Dialog v-model:visible="showTypeModal" modal header="Nuevo Tipo" :baseZIndex="1100">
            <InputText v-model="typeForm.name" placeholder="Nombre tipo" />
            <Button label="Guardar" @click="saveType" />
        </Dialog>

        <Dialog v-model:visible="showCategoryModal" modal header="Nueva Categoría" :baseZIndex="1100">
            <InputText v-model="categoryForm.name" placeholder="Nombre categoría" />
            <Button label="Guardar" @click="saveCategory" />
        </Dialog>

        <Dialog v-model:visible="showSubCategoryModal" modal header="Nueva Subcategoría" :baseZIndex="1100">
            <InputText v-model="subCategoryForm.name" placeholder="Nombre subcategoría" />
            <Button label="Guardar" @click="saveSubCategory" />
        </Dialog>

        <Dialog v-model:visible="showBrandModal" modal header="Nueva Marca" :baseZIndex="1100">
            <InputText v-model="brandForm.name" placeholder="Nombre marca" />
            <Button label="Guardar" @click="saveBrand" />
        </Dialog>
    </div>
</template>

<style scoped>
.roles-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
