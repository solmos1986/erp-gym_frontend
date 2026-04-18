<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import partnerService from '../../service/partner.service';
import { useAuthStore } from '../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// ================== ESTADOS PRINCIPALES ==================
const partners = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingPartner = ref(null);
const submitted = ref(false);

// ================== FORM PARTNER ==================
const form = ref({
    name: '',
    type: 'CLIENT',
    document: '',
    phone: '',
    email: '',
    address: ''
});

// ================== VALIDACIONES ==================
const isFormValid = computed(() => {
    return form.value.name && form.value.type;
});

function isInvalid(field) {
    return submitted.value && !form.value[field];
}

// ================== PERMISOS ==================
const canView = computed(() => auth.can('ERP_PARTNERS_VIEW'));
const canCreate = computed(() => auth.can('ERP_PARTNERS_CREATE'));
const canUpdate = computed(() => auth.can('ERP_PARTNERS_EDIT'));
const canDelete = computed(() => auth.can('ERP_PARTNERS_DELETE'));

// ================== CARGA INICIAL ==================
async function loadPartners() {
    loading.value = true;
    try {
        partners.value = await partnerService.getAll();
    } finally {
        loading.value = false;
    }
}

onMounted(loadPartners);

// ================== CRUD PARTNER ==================
function openCreate() {
    submitted.value = false;
    editingPartner.value = null;
    form.value = {
        name: '',
        type: 'CLIENT',
        document: '',
        phone: '',
        email: '',
        address: ''
    };
    dialogVisible.value = true;
}

function openEdit(partner) {
    submitted.value = false;
    editingPartner.value = partner;
    form.value = { ...partner };
    dialogVisible.value = true;
}

async function save() {
    submitted.value = true;
    if (!isFormValid.value) return;

    try {
        if (editingPartner.value) {
            await partnerService.update(editingPartner.value.id, form.value);
            toast.add({ severity: 'success', summary: 'Partner actualizado', life: 3000 });
        } else {
            await partnerService.create(form.value);
            toast.add({ severity: 'success', summary: 'Partner creado', life: 3000 });
        }

        dialogVisible.value = false;
        loadPartners();
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error al guardar el partner', life: 3000 });
    }
}

async function remove(partner) {
    if (!confirm(`¿Eliminar el partner ${partner.name}?`)) return;

    try {
        await partnerService.remove(partner.id);
        toast.add({ severity: 'success', summary: 'Partner eliminado', life: 3000 });
        loadPartners();
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'No se pudo eliminar el partner', life: 3000 });
    }
}

// ================== HELPERS ==================
function formatType(type) {
    if (type === 'CLIENT') return 'Cliente';
    if (type === 'SUPPLIER') return 'Proveedor';
    if (type === 'BOTH') return 'Cliente / Proveedor';
    return type;
}
</script>

<template>
    <div class="card">
        <!-- HEADER -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo Partner" v-if="canCreate" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openCreate" />
            </template>
        </Toolbar>

        <div class="flex justify-content-between mb-3">
            <h3>Clientes / Proveedores</h3>
        </div>

        <!-- LISTADO -->
        <DataTable v-if="canView" :value="partners" :loading="loading" paginator :rows="20" :rowsPerPageOptions="[5, 10, 25]" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros">
            <Column field="name" header="Nombre" sortable style="min-width: 12rem" />
            <Column field="type" header="Tipo" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ formatType(data.type) }}
                </template>
            </Column>
            <Column field="document" header="Documento" sortable style="min-width: 10rem" />
            <Column field="phone" header="Teléfono" sortable style="min-width: 10rem" />
            <Column field="email" header="Email" sortable style="min-width: 12rem" />

            <Column header="Acciones" style="width: 10rem">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" v-if="canUpdate" @click="openEdit(data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" v-if="canDelete" @click="remove(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="DETALLES DEL PARTNER" :style="{ width: '600px' }">
            <div class="grid grid-cols-1 gap-4">
                <div>
                    <label class="block font-medium mb-1">Nombre</label>
                    <InputText v-model="form.name" :class="{ 'p-invalid': isInvalid('name') }" class="w-full" />
                    <small v-if="isInvalid('name')" class="p-error">Nombre es obligatorio</small>
                </div>

                <div>
                    <label class="block font-medium mb-1">Tipo</label>
                    <Dropdown
                        v-model="form.type"
                        :options="[
                            { label: 'Cliente', value: 'CLIENT' },
                            { label: 'Proveedor', value: 'SUPPLIER' },
                            { label: 'Cliente y Proveedor', value: 'BOTH' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                </div>

                <div>
                    <label class="block font-medium mb-1">Documento</label>
                    <InputText v-model="form.document" class="w-full" />
                </div>

                <div>
                    <label class="block font-medium mb-1">Teléfono</label>
                    <InputText v-model="form.phone" class="w-full" />
                </div>

                <div>
                    <label class="block font-medium mb-1">Email</label>
                    <InputText v-model="form.email" class="w-full" />
                </div>

                <div>
                    <label class="block font-medium mb-1">Dirección</label>
                    <Textarea v-model="form.address" class="w-full" rows="3" />
                </div>
            </div>

            <div class="flex justify-end gap-4 mt-4">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" :disabled="(editingPartner ? !canUpdate : !canCreate) || !isFormValid" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
