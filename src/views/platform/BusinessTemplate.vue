<script setup>
import BusinessTemplateService from '@/service/businessTemplate.service';
import PermissionService from '@/service/permission.service';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();

const templates = ref([]);
const loading = ref(false);

const dialogVisible = ref(false);
const roleDialogVisible = ref(false);
const editingTemplate = ref(null);

const expandedRows = ref([]);

const selectedPermissions = ref([]);
const selectedRolePermissions = ref([]);
const permissions = ref([]);

const editingRole = ref(null);
const currentTemplate = ref(null);

const form = ref({
    code: '',
    name: '',
    description: ''
});
const roleForm = ref({
    id: null,
    name: ''
});

async function loadTemplates() {
    loading.value = true;

    try {
        templates.value = await BusinessTemplateService.getAll();
    } finally {
        loading.value = false;
    }
}
function openCreateRole(template) {
    currentTemplate.value = template;

    editingRole.value = null;

    roleForm.value = {
        id: null,
        name: ''
    };

    selectedRolePermissions.value = [];

    roleDialogVisible.value = true;
}
function openEditRole(template, role) {
    currentTemplate.value = template;

    editingRole.value = role;

    roleForm.value = {
        id: role.id,
        name: role.name
    };

    selectedRolePermissions.value = role.permissions.map((p) => p.permissionId);

    roleDialogVisible.value = true;
}

async function loadPermissions() {
    try {
        permissions.value = await PermissionService.getCatalog();
    } catch (error) {
        console.error(error);
    }
}

function openCreate() {
    editingTemplate.value = null;
    selectedPermissions.value = [];
    form.value = {
        code: '',
        name: '',
        description: ''
    };

    dialogVisible.value = true;
}

function openEdit(template) {
    editingTemplate.value = template;

    form.value = {
        code: template.code,
        name: template.name,
        description: template.description || ''
    };

    selectedPermissions.value = template.permissions.map((p) => p.permissionId);

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

        if (!form.value.name) {
            toast.add({
                severity: 'warn',
                summary: 'Nombre requerido',
                life: 3000
            });

            return;
        }

        const payload = {
            code: form.value.code,
            name: form.value.name,
            description: form.value.description,
            permissions: selectedPermissions.value
        };

        if (editingTemplate.value) {
            await BusinessTemplateService.update(editingTemplate.value.id, payload);

            toast.add({
                severity: 'success',
                summary: 'Vertical actualizada',
                life: 3000
            });
        } else {
            await BusinessTemplateService.create(payload);

            toast.add({
                severity: 'success',
                summary: 'Vertical creada',
                life: 3000
            });
        }

        dialogVisible.value = false;

        form.value = {
            code: '',
            name: '',
            description: ''
        };

        selectedPermissions.value = [];

        await loadTemplates();
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'Error guardando',
            life: 3000
        });
    }
}
async function saveRole() {
    try {
        if (!roleForm.value.name) {
            toast.add({
                severity: 'warn',
                summary: 'Nombre requerido',
                life: 3000
            });

            return;
        }

        const payload = {
            name: roleForm.value.name,
            permissions: selectedRolePermissions.value
        };

        if (editingRole.value) {
            await BusinessTemplateService.updateRole(currentTemplate.value.id, editingRole.value.id, payload);

            toast.add({
                severity: 'success',
                summary: 'Rol actualizado',
                life: 3000
            });
        } else {
            await BusinessTemplateService.createRole(currentTemplate.value.id, payload);

            toast.add({
                severity: 'success',
                summary: 'Rol creado',
                life: 3000
            });
        }

        roleDialogVisible.value = false;

        await loadTemplates();
    } catch (error) {
        console.error(error);

        toast.add({
            severity: 'error',
            summary: error.response?.data?.message || 'Error guardando rol',
            life: 3000
        });
    }
}

async function removeRole(template, role) {
    try {
        await BusinessTemplateService.deleteRole(template.id, role.id);

        toast.add({
            severity: 'success',
            summary: 'Rol eliminado',
            life: 3000
        });

        await loadTemplates();
    } catch (error) {
        console.error(error);

        toast.add({
            severity: 'error',
            summary: error.response?.data?.message || 'Error eliminando rol',
            life: 3000
        });
    }
}
async function toggle(template) {
    await BusinessTemplateService.toggle(template.id);

    toast.add({
        severity: 'success',
        summary: 'Estado actualizado',
        life: 3000
    });

    loadTemplates();
}
const availableRolePermissions = computed(() => {
    if (!currentTemplate.value) return [];

    return currentTemplate.value.permissions.map((p) => ({
        id: p.permission.id,
        code: p.permission.code
    }));
});

onMounted(async () => {
    await loadTemplates();
    await loadPermissions();
});
</script>

<template>
    <div>
        <div class="flex justify-content-between mb-3">
            <h3>Verticales de Negocio</h3>
        </div>

        <Toolbar class="mb-3">
            <template #start>
                <Button label="Nueva Vertical" icon="pi pi-plus" @click="openCreate" />
            </template>
        </Toolbar>
        <div class="card mt-4">
            <DataTable v-model:expanded-rows="expandedRows" :value="templates" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" striped-rows responsive-layout="scroll" data-key="id">
                <Column expander style="width: 3rem" />
                <template #expansion="slotProps">
                    <!-- PERMISOS DEL VERTICAL -->

                    <div class="p-3">
                        <div class="flex justify-between mb-3">
                            <div>
                                <h5>Permisos del Vertical</h5>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2 mb-4">
                            <Tag v-for="permission in slotProps.data.permissions" :key="permission.id" :value="permission.permission.code" />
                        </div>

                        <Divider />
                        <div class="flex justify-between mb-3">
                            <div>
                                <h5>Roles</h5>
                            </div>
                            <div>
                                <Button label="Nuevo Rol" icon="pi pi-plus" size="small" @click="openCreateRole(slotProps.data)" />
                            </div>
                        </div>

                        <DataTable :value="slotProps.data.roleTemplates">
                            <Column field="name" header="Rol" />

                            <Column header="Permisos">
                                <template #body="{ data }">
                                    <div class="flex flex-wrap gap-1">
                                        <Tag v-for="permission in data.permissions" :key="permission.id" :value="permission.permission.code" />
                                    </div>
                                </template>
                            </Column>

                            <Column header="Acción">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text />
                                    <Button icon="pi pi-pencil" text @click="openEditRole(slotProps.data, data)" />
                                    <Button icon="pi pi-trash" text severity="danger" @click="removeRole(slotProps.data, data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </template>
                <Column field="code" header="Código" />

                <Column field="name" header="Nombre" />

                <Column field="description" header="Descripción" />

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

        <Dialog v-model:visible="dialogVisible" modal header="Vertical" style="width: 500px">
            <InputText v-model="form.code" placeholder="Código" class="w-full mb-2" />

            <InputText v-model="form.name" placeholder="Nombre" class="w-full mb-2" />

            <Textarea v-model="form.description" rows="4" class="w-full" placeholder="Descripción" />
            <div class="field mt-3">
                <label>Permisos</label>

                <MultiSelect v-model="selectedPermissions" :options="permissions" option-label="code" option-value="id" filter display="chip" placeholder="Seleccionar permisos" class="w-full" />
            </div>
            <div class="flex justify-content-end gap-2 mt-3">
                <Button label="Cancelar" text @click="dialogVisible = false" />

                <Button label="Guardar" severity="success" @click="save" />
            </div>
        </Dialog>
        <Dialog v-model:visible="roleDialogVisible" modal header="Rol" :style="{ width: '700px' }">
            <div class="field mt-3">
                <label class="font-semibold">Nombre</label>

                <InputText v-model="roleForm.name" placeholder="Nombre" class="w-full mb-2" />
            </div>

            <div class="field mt-3">
                <label class="font-semibold">Permisos</label>

                <MultiSelect v-model="selectedRolePermissions" :options="availableRolePermissions" option-label="code" option-value="id" filter display="chip" placeholder="Seleccionar permisos" class="w-full" />
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="roleDialogVisible = false" />

                <Button label="Guardar" icon="pi pi-save" @click="saveRole" />
            </template>
        </Dialog>
    </div>
</template>
