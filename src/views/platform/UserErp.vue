<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import BranchService from '../../service/branch.service';
import roleTenantService from '../../service/roleTenant.service';
import userService from '../../service/user.service';
import { useAuthStore } from '../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const users = ref([]);
const branches = ref([]);
const allroles = ref([]);

const loading = ref(false);
const dialogVisible = ref(false);
const editingUser = ref(null);

const form = ref({
    fullName: '',
    email: '',
    password: '',
    branchId: null,
    roles: []
});

// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_USERS_VIEW'));
const canCreate = computed(() => auth.can('TENANT_USERS_CREATE'));
const canUpdate = computed(() => auth.can('TENANT_USERS_EDIT'));
const canDelete = computed(() => auth.can('TENANT_USERS_DELETE'));

// =====================
// CARGAS
// =====================
async function loadBranches() {
    try {
        branches.value = await BranchService.getAll(); // 🔥 ya no por empresa
    } catch {
        toast.add({ severity: 'error', summary: 'Error al cargar sucursales', life: 3000 });
    }
}

async function loadRoles() {
    allroles.value = await roleTenantService.getAll(); // 🔥 backend ya filtra
}

async function loadUsers() {
    loading.value = true;
    try {
        users.value = await userService.getAll();
    } finally {
        loading.value = false;
    }
}

// =====================
// CRUD
// =====================
function openCreate() {
    editingUser.value = null;

    form.value = {
        fullName: '',
        email: '',
        password: '',
        branchId: null,
        roles: []
    };

    dialogVisible.value = true;
}

function openEdit(user) {
    console.log('EditandoEEEE usuario:', user.fullName); // Debug: Verificar el usuario que se va a editar
    editingUser.value = user;

    form.value = {
        fullName: user.fullName,
        email: user.email,
        password: '',
        branchId: user.branchId,
        roles: user.roles.map((r) => r.roleId)
    };

    dialogVisible.value = true;
}

async function save() {
    try {
        if (!form.value.branchId) {
            toast.add({ severity: 'warn', summary: 'Seleccione una sucursal', life: 3000 });
            return;
        }

        if (editingUser.value) {
            await userService.update(editingUser.value.id, form.value);
            toast.add({ severity: 'success', summary: 'Usuario actualizado', life: 3000 });
        } else {
            await userService.create(form.value);
            toast.add({ severity: 'success', summary: 'Usuario creado', life: 3000 });
        }

        dialogVisible.value = false;
        loadUsers();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error al guardar usuario', life: 3000 });
    }
}

async function remove(user) {
    if (!confirm(`¿Desactivar usuario ${user.fullfullName}?`)) return;

    await userService.remove(user.id);
    toast.add({ severity: 'success', summary: 'Usuario desactivado', life: 3000 });
    loadUsers();
}

// =====================
// INIT
// =====================
onMounted(async () => {
    await loadBranches();
    await loadRoles();
    await loadUsers();
});
</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo Usuario" v-if="canCreate" icon="pi pi-plus" severity="secondary" class="mr-2"
                    @click="openCreate" />
            </template>

            <template #end>
                <!-- <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" /> -->
            </template>
        </Toolbar>
        <div class="flex justify-content-between mb-3">
            <h3>Usuarios TENANT</h3>
        </div>
        <DataTable v-if="canView" :value="users" :loading="loading">
            <Column field="fullName" header="Nombre" />
            <Column field="email" header="Email" />

            <Column header="Sucursal">
                <template #body="{ data }">
                    {{ data.branch?.name || '-' }}
                </template>
            </Column>

            <Column header="Roles">
                <template #body="{ data }">
                    <Tag v-for="r in data.roles" :key="r.id" class="mr-1" severity="info">
                        {{ r.role.name }}
                    </Tag>
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="{ data }">
                    <Button v-if="canUpdate" icon="pi pi-pencil" text @click="openEdit(data)" />

                    <Button v-if="canDelete" icon="pi pi-trash" text severity="danger" @click="remove(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="Usuario ERP" style="width: 400px">
            <div class="field">
                <label>Nombre</label>
                <InputText v-model="form.fullName" class="w-full" />
            </div>

            <div class="field">
                <label>Email</label>
                <InputText v-model="form.email" class="w-full" />
            </div>

            <div class="field">
                <label>Sucursal</label>
                <Dropdown v-model="form.branchId" :options="branches" optionLabel="name" optionValue="id"
                    placeholder="Seleccione sucursal" class="w-full" />
            </div>

            <div class="field">
                <label>Roles</label>
                <MultiSelect v-model="form.roles" :options="allroles" optionLabel="name" optionValue="id"
                    class="w-full" />
            </div>

            <div class="field">
                <label>Password</label>
                <Password v-model="form.password" toggleMask class="w-full" :feedback="false" />
            </div>

            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" severity="success" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
