<script setup>
import UserDialog from '@/components/UserDialog.vue';
import { computed, onMounted, ref, watch } from 'vue';
import CompaniesService from '../../service/company.service';
import PermissionsService from '../../service/permissions.service';
import RolesService from '../../service/roles.service';
import { useAuthStore } from '../../store/auth.store';
// Importar Select de PrimeVue
import { UserService } from '@/service/user.service';
import Select from 'primevue/select';

const authStore = useAuthStore();

/* =======================
   STATE
======================= */
const usuarios = ref([]);
const roles = ref([]);
const companies = ref([]);
const permissions = ref([]);
const selectedCompany = ref(null);
const selectedRole = ref(null);
const dialogVisible = ref(false);
const dataTableKey = ref(0); // Agregar una key reactiva para el DataTable
const companiesLoaded = ref(false); // Flag para asegurarnos de que las emprolesas están cargadas

/* =======================
   COMPUTED
======================= */
const isSuperAdmin = computed(() => authStore.user?.type === 'SUPER_ADMIN');

/* =======================
   LIFECYCLE
======================= */
onMounted(async () => {
    console.log('onMounted ejecutadodd');

    if (!authStore.user) {
        console.log('No hay usuario autenticado, deteniendo ejecución');
        return; // Sale del código si no hay usuario autenticado
    }

    // Cargar permisos
    const permRes = await PermissionsService.getAll();
    permissions.value = permRes.data ?? permRes; //Trae los permisos que se mostraran en el select del modal crear/editar Roles

    console.log('Emprolesas cargadas: ', companies.value); // Verificamos si companies tiene datos

    // Recuperamos el companyId desde localStorage **después** de cargar las emprolesas
    const savedCompanyId = localStorage.getItem('selectedCompanyId');

    // Si hay un companyId guardado en localStorage, asignamos la emprolesa corrolespondiente
    if (savedCompanyId) {
        // Buscamos el objeto completo de la emprolesa usando el companyId
        console.log('savedCompanyId', savedCompanyId);
        selectedCompany.value = companies.value.find((company) => company.id === parseInt(savedCompanyId));
        console.log('Emprolesa seleccionada desde localStorage: ', selectedCompany.value); // Verificamos si se asignó correctamente
    }

    // Si no se ha encontrado una emprolesa en localStorage, seleccionamos la primera emprolesa
    if (!selectedCompany.value && companies.value.length > 0) {
        selectedCompany.value = companies.value[0];
        console.log('Primera emprolesa seleccionada: ', selectedCompany.value.id); // Verificamos la selección de la primera emprolesa
    } else {
        // Primero cargamos las emprolesas
        try {
            const compRes = await CompaniesService.getAll();
            console.log('1 Respuesta de CompaniesService.getAll(): ', compRes); // Verificamos la rolespuesta de la API
            companies.value = compRes;
        } catch (error) {
            console.error('Error al cargar las emprolesas: ', error); // Capturamos cualquier error en la carga de emprolesas
            return;
        }
    }
    // Indicamos que las emprolesas se han cargado
    companiesLoaded.value = true;
    // Llamamos a loadUsuarios después de haber asignado la emprolesa
    await loadUsuarios();
    console.log('usuarios 234', usuarios.value);
});

/* =======================
   WATCHER
======================= */
// Guardar emprolesa seleccionada en localStorage
watch(selectedCompany, (newCompany) => {
    if (newCompany) {
        console.log('Guardando companyId:', newCompany); // Verifica que se guarda correctamente
        // Guardamos solo el ID de la emprolesa seleccionada en localStorage (no el objeto completo)
        localStorage.setItem('selectedCompanyId', newCompany);
    }
});

// Recargar roles según la emprolesa seleccionada
async function loadUsuarios() {
    if (!selectedCompany.value) return;

    console.log('Cargando usuarios para la emprolesa:', selectedCompany.value); // Verificar la emprolesa seleccionada

    // Limpiar roles actuales
    roles.value = [];
    usuarios.value = [];
    console.log('que company es para role: ', selectedCompany.value);
    const rol = await RolesService.getByCompany(selectedCompany.value);

    console.log('roles justo despues API', roles);
    const users = await UserService.getUsersByCompany(selectedCompany.value);
    console.log('usuarios justo despues consumir API: ', usuarios);
    // Si roles.data tiene roles, los cargamos
    if (users.data && users.data.length > 0) {
        roles.value = rol.data;
        console.log('roles', roles);
        usuarios.value = users.data;
        console.log('usuarios ', usuarios);
    } else {
        console.log('No hay roles asignados para esta emdrolesa');
        roles.value = []; // Si no hay roles, asignamos un array vacío
        usuarios.value = [];
    }

    // Forzar re-render de DataTable
    dataTableKey.value++; // Incrementar la key para que se vuelva a renderizar
    console.log('llego a dataTableKey?', dataTableKey.value);
}

function handleCompanyChange() {
    console.log('Empresa seleccionada:', selectedCompany.value);
    loadUsuarios(); // Llamar a loadUsuarios cuando cambiamos de emprolesa
}

function openNew() {
    console.log('selected values', companies, selectedCompany?.value);
    selectedRole.value = null;
    dialogVisible.value = true;
}

function editRole(role) {
    selectedRole.value = role;
    dialogVisible.value = true;
}

async function saveRole(data) {
    console.log('desde roleVue SaveRole dataa', data, 'selectedRole', selectedRole.value);
    data.companyId = selectedCompany.value;
    console.log('nueva dataa?', data);
    await UserService.createUser(data);
    // if (selectedRole.value) {
    //     await UserService.update(selectedRole.value.id, data);
    // } else {
    //     await UserService.create(data);
    // }

    dialogVisible.value = false;
    await loadUsuarios();
}

async function deleteRole(id) {
    await RolesService.remove(id);
    await loadUsuarios();
}
</script>

<template>
    <div class="card">
        <h5>Usuarios</h5>

        <!-- Verificar si las emprolesas están cargadas antes de mostrar el Select -->
        <Select v-show="isSuperAdmin && companiesLoaded && companies.length > 0" v-model="selectedCompany" :options="companies" optionLabel="name" optionValue="id" placeholder="Seleccionar empresa" class="mb-3" @change="handleCompanyChange" />

        <!-- Mensaje de carga mientras se obtienen las emprolesas -->
        <p v-if="!companiesLoaded">Cargando empresas...</p>

        <Button label="Nuevo Usuario" icon="pi pi-plus" class="mb-3" @click="openNew" />

        <!-- DataTable con mensaje si no hay roles -->
        <DataTable :key="dataTableKey" :value="usuarios" rolesponsiveLayout="scroll">
            <Column field="name" header="Nombre">
                <!-- Mostrar mensaje si no hay roles -->
                <template v-if="usuarios.length === 0">
                    <div class="p-d-flex p-jc-center">
                        <p>No hay usuarios asignados para esta empresa.</p>
                    </div>
                </template>
            </Column>
            <Column field="role.name" header="Rol" />
            <Column header="Permisos">
                <template #body="{ data }">
                    <Tag v-for="rp in data.role.rolePermissions" :key="rp.permissionId" class="mr-1" severity="info">
                        {{ rp.permission.name }}
                    </Tag>
                </template>
            </Column>
            <Column field="email" header="Email"> </Column>
            <Column header="Acciones" style="width: 120px">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" text @click="editRole(data)" />
                    <Button icon="pi pi-trash" text severity="danger" @click="deleteRole(data.id)" />
                </template>
            </Column>
        </DataTable>
        <UserDialog v-model="dialogVisible" :usuario="selectedRole" :companyId="selectedCompany?.value" :roles="roles" @save="saveRole" />
    </div>
</template>
