<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import CashBoxService from '../../service/cashbox.service';
import { useAuthStore } from '../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

const cashBoxes = ref([]);
const loading = ref(false);

const showModal = ref(false);
const editingBox = ref(null);

const form = ref({
    name: '',
    branchId: auth.user.branchId
});

async function loadCashBoxes() {
    loading.value = true;
    try {
        cashBoxes.value = await CashBoxService.getAll();
    } finally {
        loading.value = false;
    }
}

onMounted(loadCashBoxes);

function openNew() {
    editingBox.value = null;
    form.value = {
        name: '',
        branchId: auth.user.branchId
    };
    showModal.value = true;
}

function openEdit(box) {
    editingBox.value = box;
    form.value = {
        name: box.name,
        branchId: box.branchId
    };
    showModal.value = true;
}

async function save() {
    try {
        if (editingBox.value) {
            await CashBoxService.update(editingBox.value.id, form.value);
            toast.add({ severity: 'success', summary: 'Caja actualizada', life: 2000 });
        } else {
            await CashBoxService.create(form.value);
            toast.add({ severity: 'success', summary: 'Caja creada', life: 2000 });
        }

        showModal.value = false;
        await loadCashBoxes();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: e.response?.data?.message || e.message,
            life: 3000
        });
    }
}

async function toggle(box) {
    try {
        await CashBoxService.toggleActive(box.id);
        await loadCashBoxes();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'No se pudo cambiar estado', life: 2000 });
    }
}
</script>

<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Nueva Caja" icon="pi pi-plus" severity="success" @click="openNew" />
            </template>
        </Toolbar>
        <div class="flex justify-content-between mb-3">
            <h3>Cajas Físicas</h3>
        </div>
        <DataTable :value="cashBoxes" :loading="loading">
            <Column field="id" header="ID" />
            <Column field="name" header="Nombre" />
            <Column field="branch.name" header="Sucursal" />
            <Column field="isAvailable" header="Disponible">
                <template #body="{ data }">
                    <Tag :value="data.isAvailable ? 'Sí' : 'No'" :severity="data.isAvailable ? 'success' : 'danger'" />
                </template>
            </Column>

            <Column field="isActive" header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.isActive ? 'Activa' : 'Inactiva'" :severity="data.isActive ? 'success' : 'secondary'" />
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" text @click="openEdit(data)" />
                    <Button :icon="data.isActive ? 'pi pi-times' : 'pi pi-check'" :severity="data.isActive ? 'danger' : 'success'" text @click="toggle(data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="showModal" header="Caja física" modal style="width: 400px">
            <div class="mb-3">
                <label class="block font-medium mb-1">Nombre</label>
                <InputText v-model="form.name" class="w-full" />
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="showModal = false" />
                <Button label="Guardar" severity="success" @click="save" />
            </template>
        </Dialog>
    </div>
</template>
