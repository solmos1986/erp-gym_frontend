<script setup>
import PermissionService from '@/service/permission.service';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

const permissions = ref([]);
const loading = ref(false);

const dialogVisible = ref(false);

const selectedScope = ref(null);

const scopeOptions = [
    {
        label: 'Todos',
        value: null
    },
    {
        label: 'SYSTEM',
        value: 'SYSTEM'
    },
    {
        label: 'TENANT',
        value: 'TENANT'
    }
];

const editingPermission = ref(null);

const form = ref({
    code: '',
    description: '',
    scope: 'TENANT'
});

async function loadPermissions() {
    loading.value = true;

    try {
        permissions.value = await PermissionService.getCatalog(selectedScope.value);
    } finally {
        loading.value = false;
    }
}

function openCreate() {
    editingPermission.value = null;

    form.value = {
        code: '',
        description: '',
        scope: 'TENANT'
    };

    dialogVisible.value = true;
}

function openEdit(permission) {
    editingPermission.value = permission;

    form.value = {
        code: permission.code,
        description: permission.description || '',
        scope: permission.scope
    };

    dialogVisible.value = true;
}

async function save() {
    try {
        if (!form.value.code) {
            toast.add({
                severity: 'warn',
                summary: 'Código requerido',
                life: 3000
            });

            return;
        }

        if (!form.value.scope) {
            toast.add({
                severity: 'warn',
                summary: 'Scope requerido',
                life: 3000
            });

            return;
        }

        const payload = {
            code: form.value.code,
            description: form.value.description,
            scope: form.value.scope
        };

        if (editingPermission.value) {
            await PermissionService.update(editingPermission.value.id, payload);

            toast.add({
                severity: 'success',
                summary: 'Permiso actualizado',
                life: 3000
            });
        } else {
            await PermissionService.create(payload);

            toast.add({
                severity: 'success',
                summary: 'Permiso creado',
                life: 3000
            });
        }

        dialogVisible.value = false;

        await loadPermissions();
    } catch (error) {
        console.error(error);

        toast.add({
            severity: 'error',
            summary: error.response?.data?.message || 'Error guardando permiso',
            life: 3000
        });
    }
}

async function toggle(permission) {
    console.log('CLICK TOGGLE', permission);

    try {
        const result = await PermissionService.toggle(permission.id);

        console.log('RESULTADO', result);

        toast.add({
            severity: 'success',
            summary: 'Estado actualizado',
            life: 3000
        });

        await loadPermissions();
    } catch (error) {
        console.error('ERROR TOGGLE', error);

        toast.add({
            severity: 'error',
            summary: error.response?.data?.message || error.message || 'Error',
            life: 3000
        });
    }
}

onMounted(async () => {
    await loadPermissions();
});
</script>
<template>
    <div>
        <div class="flex justify-content-between mb-3">
            <h3>Permisos</h3>
        </div>

        <Toolbar class="mb-3">
            <template #start>
                <Button label="Nuevo Permiso" icon="pi pi-plus" @click="openCreate" />
            </template>

            <template #end>
                <Select v-model="form.scope" :options="scopeOptions" option-label="label" option-value="value" placeholder="Filtrar Scope" style="width: 200px" @change="loadPermissions" />
            </template>
        </Toolbar>

        <div class="card mt-4">
            <DataTable :value="permissions" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" striped-rows responsive-layout="scroll" data-key="id">
                <Column field="code" header="Código" />

                <Column field="description" header="Descripción" />

                <Column field="scope" header="Scope">
                    <template #body="{ data }">
                        <Tag :value="data.scope" :severity="data.scope === 'SYSTEM' ? 'danger' : 'info'" />
                    </template>
                </Column>

                <Column header="Estado">
                    <template #body="{ data }">
                        <Tag :value="data.isActive ? 'Activo' : 'Inactivo'" :severity="data.isActive ? 'success' : 'danger'" />
                    </template>
                </Column>

                <Column header="Acciones">
                    <template #body="{ data }">
                        <Button icon="pi pi-pencil" text @click="openEdit(data)" />

                        <Button :icon="data.isActive ? 'pi pi-times' : 'pi pi-check'" text :severity="data.isActive ? 'danger' : 'success'" @click="toggle(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialogVisible" modal header="Permiso" style="width: 500px">
            <div class="field">
                <label>Código</label>

                <InputText v-model="form.code" placeholder="Ej: TENANT_USERS_VIEW" class="w-full" :disabled="editingPermission" />
            </div>

            <div class="field mt-3">
                <label>Descripción</label>

                <InputText v-model="form.description" placeholder="Descripción" class="w-full" />
            </div>

            <div class="field mt-3">
                <label>Scope</label>

                <Dropdown v-model="form.scope" :options="scopeOptions" option-label="label" option-value="value" placeholder="Seleccione scope" class="w-full" />
            </div>

            <div class="flex justify-content-end gap-2 mt-4">
                <Button label="Cancelar" text @click="dialogVisible = false" />

                <Button label="Guardar" severity="success" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
