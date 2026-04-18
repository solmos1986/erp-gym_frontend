<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import roleStaffService from '../../service/roleStaff.service';
import userStaffService from '../../service/userStaff.service';
import { useAuthStore } from '../../store/auth.store';
const toast = useToast();
const auth = useAuthStore();

/**
 * Estados
 */
const users = ref([]); // Lista de usuarios
const loading = ref(false);
const dialogVisible = ref(false);
const editingUsers = ref(null);

const form = ref({
    name: '',
    email: '',
    password: '',
    roleIds: [''],
    companyId: 1 // Asignar un valor predeterminado si es necesario
});

/**
 * Permisos por acción
 */
const canView = computed(() => auth.can('PLATFORM_USERS_VIEW'));
const canCreate = computed(() => auth.can('PLATFORM_USERS_CREATE'));
const canUpdate = computed(() => auth.can('PLATFORM_USERS_EDIT'));
const canDelete = computed(() => auth.can('PLATFORM_USERS_DELETE'));
const rolesList = ref({});
const allroles = ref([]);
/**
 * Cargar usuarios
 */
async function loadUsers() {
    const roles = await roleStaffService.getAll();
    allroles.value = roles;
    console.log('allroles', roles);
    if (!canView.value) return;

    try {
        const data = await userStaffService.getAll(); // Reemplazar con tu método de obtener usuarios
        rolesList.value = data.flatMap((user) => user.roles);

        console.log('rolesList', rolesList.value);
        users.value = data;
    } finally {
        loading.value = false;
    }
}

/**
 * Crear usuario
 */
function openCreate() {
    if (!canCreate.value) return;

    editingUsers.value = null;
    form.value = { name: '', email: '', password: '', roleIds: [], companyId: 1 }; // Restablecer formulario
    dialogVisible.value = true;
}

/**
 * Editar usuario
 */
function openEdit(user) {
    if (!canUpdate.value) return;

    editingUsers.value = user;
    form.value = {
        name: user.name,
        email: user.email,
        password: user.password,
        roleIds: user.roles.map((role) => role.roleId), // Asignar los permisos seleccionados a form.permissionIds
        companyId: 1
    };
    dialogVisible.value = true;
}

/**
 * Guardar (create / update)
 */
async function save() {
    try {
        if (editingUsers.value) {
            if (!canUpdate.value) return;

            await userStaffService.update(editingUsers.value.id, form.value); // Llamar a la API para actualizar
            toast.add({
                severity: 'success',
                summary: 'Usuario actualizado',
                life: 3000
            });
        } else {
            if (!canCreate.value) return;
            await userStaffService.create(form.value); // Llamar a la API para crear
            toast.add({
                severity: 'success',
                summary: 'Usuario creado',
                life: 3000
            });
        }

        dialogVisible.value = false;
        loadUsers(); // Recargar los usuarios después de crear o actualizar
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al guardar el usuario',
            life: 3000
        });
    }
}

/**
 * Eliminar usuario
 */
async function remove(user) {
    if (!canDelete.value) return;

    if (!confirm(`¿Eliminar usuario ${user.name}?`)) return;

    try {
        await userStaffService.remove(user.id, user.id); // Llamar a la API para eliminar el usuario

        toast.add({
            severity: 'success',
            summary: 'Usuario eliminado',
            life: 3000
        });

        await loadUsers(); // Recargar la lista de usuarios
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al eliminar usuario',
            life: 3000
        });
    }
}

onMounted(loadUsers); // Cargar usuarios al montar el componente
</script>

<template>
    <div class="card">
        <!-- HEADER -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo Usuario" v-if="canCreate" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openCreate" />
            </template>

            <template #end>
                <!-- <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" /> -->
            </template>
        </Toolbar>
        <div class="flex justify-content-between mb-3">
            <h3>Usuarios de Staff</h3>
        </div>

        <!-- LISTADO -->
        <DataTable
            v-if="canView"
            :value="users"
            :loading="loading"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rows="20"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
        >
            <Column field="name" header="Usuario" sortable style="min-width: 12rem" />
            <Column field="email" header="Email" sortable style="min-width: 12rem" />
            <!-- <Column field="role" header="Roles" sortable style="min-width: 12rem" /> -->
            <Column header="Roles">
                <template #body="{ data }">
                    <!-- Mostrar permisos como Tags -->
                    <div class="roles-container">
                        <Tag v-for="role in data.roles" :key="role.id" class="mr-2" severity="info">
                            {{ role.role.name }}
                        </Tag>
                    </div>
                </template>
            </Column>

            <!-- Mostrar Permisos dentro de Tags -->
            <Column header="Acciones" style="width: 12rem">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" v-if="canUpdate" @click="openEdit(data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" v-if="canDelete" @click="remove(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="Usuario" :style="{ width: '400px' }">
            <div class="field mb-3">
                <label>Nombre de Usuario</label>
                <InputText v-model="form.name" class="w-full" />
            </div>

            <div class="field mb-3">
                <label>Email</label>
                <InputText v-model="form.email" class="w-full" />
            </div>

            <!-- Selección de Rol -->
            <div class="field mb-3">
                <label>Rol</label>
                <!-- <Select v-model="form.roleId" :options="roles" optionLabel="name" optionValue="id" class="w-full" placeholder="Seleccionar rol" /> -->
                <MultiSelect v-model="form.roleIds" :options="allroles" optionLabel="name" optionValue="id" class="w-full" placeholder="Seleccionar roles" />
            </div>
            <div>
                <label> Password </label>
                <!-- 🔥 AQUÍ ESTABA EL ERROR -->
                <Password id="password" v-model="form.password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
            </div>

            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" :disabled="editingUsers ? !canUpdate : !canCreate" @click="save" />
            </div>
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
