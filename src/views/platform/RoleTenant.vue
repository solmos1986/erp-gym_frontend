<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import permissionTenantService from '../../service/permissionTenant.service';
import roleTenantService from '../../service/roleTenant.service';
import { useAuthStore } from '../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

/**
 * Estados
 */
const roles = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingRoles = ref(null);
const form = ref({
    name: '',
    permissionIds: [],
    scope: 'TENANT', // Se asegura de que los permisos se guarden aquí
    companyId: ''
});

/**
 * Permisos por acción
 */
const canView = computed(() => auth.can('TENANT_ROLES_VIEW'));
const canCreate = computed(() => auth.can('TENANT_ROLES_CREATE'));
const canUpdate = computed(() => auth.can('TENANT_ROLES_EDIT'));
const canDelete = computed(() => auth.can('TENANT_ROLES_DELETE'));
const allpermissions = ref([]);

// Obtener el token del localStorage o sesión
const token = localStorage.getItem('token');

// Decodificar el token para extraer el companyId
if (token) {
    const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodifica el JWT
    const company = decodedToken.companyId; // Accede al companyId
    // Asignar el companyId al formulario
    form.value = { roleName: '', permissionIds: [], companyId: company };
    console.log(company); // Ahora puedes usar este companyId en el frontend
}

/**
 * Cargar permisos y roles
 */
async function loadroles() {
    const permisos = await permissionTenantService.getAll();
    allpermissions.value = permisos;
    console.log('all permisos: ', permisos);
    if (!canView.value) return;
    loading.value = true;
    try {
        const data = await roleTenantService.getAll(); // Cambié el servicio de roles
        roles.value = data;
    } finally {
        loading.value = false;
    }
}

/**
 * Crear
 */
function openCreate() {
    if (!canCreate.value) return;

    editingRoles.value = null;
    form.value = { roleName: '', permissionIds: [], companyId: form.value.companyId }; // Asigna el companyId al formulario
    dialogVisible.value = true;
}

/**
 * Editar
 */
function openEdit(role) {
    if (!canUpdate.value) return;
    console.log('Rol a editar: ', role);
    editingRoles.value = role;

    // Asignar el nombre y los permisos del rol a form
    form.value = {
        roleName: role.name, // Nombre del rol
        permissionIds: role.permissions.map((permission) => permission.permission.id), // Obtener los IDs de los permisos asociados al rol
        companyId: role.companyId // Asignar el companyId (si es necesario)
    };

    dialogVisible.value = true;
}

/**
 * Guardar (create / update)
 */
async function save() {
    try {
        if (editingRoles.value) {
            if (!canUpdate.value) return;

            await roleTenantService.update(editingRoles.value.id, form.value);
            toast.add({
                severity: 'success',
                summary: 'Rol actualizado',
                life: 3000
            });
        } else {
            if (!canCreate.value) return;

            await roleTenantService.create(form.value);
            toast.add({
                severity: 'success',
                summary: 'Rol creado',
                life: 3000
            });
        }

        dialogVisible.value = false;
        loadroles();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al guardar rol',
            life: 3000
        });
    }
}

/**
 * Eliminar
 */
async function remove(role) {
    if (!canDelete.value) return;

    if (!confirm(`¿Eliminar rol ${role.name}?`)) return;

    try {
        const roleData = {
            roleId: role.id, // ID del rol
            companyId: role.companyId // Usar el companyId del token
        };
        console.log('Eliminando rol: ', roleData);
        await roleTenantService.remove(roleData); // Se cambia el servicio para eliminar roles
        toast.add({
            severity: 'success',
            summary: 'Rol eliminado',
            life: 3000
        });

        loadroles();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al eliminar rol',
            life: 3000
        });
    }
}

onMounted(loadroles);
</script>
<template>
    <div class="card">
        <!-- HEADER -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo Rol" v-if="canCreate" icon="pi pi-plus" severity="secondary" class="mr-2"
                    @click="openCreate" />
            </template>

            <template #end>
                <!-- <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" /> -->
            </template>
        </Toolbar>
        <div class="flex justify-content-between mb-3">
            <h3>Roles usuarios Tenant</h3>
        </div>

        <!-- LISTADO -->
        <DataTable v-if="canView" :value="roles" :loading="loading"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rows="20" :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} roles">
            <Column field="name" header="Roles" />

            <!-- Mostrar Permisos dentro de Tags -->
            <Column header="Permisos">
                <template #body="{ data }">
                    <div class="permissions-container">
                        <Tag v-for="permission in data.permissions" :key="permission.permission.code" class="mr-2"
                            severity="info">
                            {{ permission.permission.code }}
                        </Tag>
                    </div>
                </template>
            </Column>

            <!-- ACCIONES -->
            <Column header="Acción" :exportable="false" style="min-width: 12rem">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" v-if="canUpdate"
                        @click="openEdit(data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" v-if="canDelete"
                        @click="remove(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- Mensaje cuando no hay roles -->
        <div v-if="roles.length === 0 && !loading" class="text-center text-gray-600">
            <p>No se encontraron roles. Selecciona una empresa para ver los roles disponibles.</p>
        </div>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="Rol usuario Tenant" :style="{ width: '400px' }">
            <div class="field mb-3">
                <label>Nombre</label>
                <InputText v-model="form.roleName" class="w-full" />
            </div>

            <div class="field mb-3">
                <label>Permisos</label>
                <MultiSelect v-model="form.permissionIds" :options="allpermissions" optionLabel="code" optionValue="id"
                    class="w-full" placeholder="Seleccionar permisos" />
            </div>

            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" :disabled="!canUpdate && !canCreate" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
