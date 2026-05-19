<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
//import AuthService from '../../service/auth.service'; // 🔥 nuevo
import CompanyService from '../../service/company.service';
import PermissionTenantService from '../../service/permissionTenant.service';
import { useAuthStore } from '../../store/auth.store';
import BranchTable from './BranchTable.vue';

const toast = useToast();
const auth = useAuthStore();

/**
 * Estados
 */
const companies = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingCompany = ref(null);
const tenantPermissions = ref([]);
const selectedPermissions = ref([]);
const selectedLogo = ref(null);
const logoPreview = ref(null);
/**
 * 🔥 FORM CORRECTO (ALINEADO AL BACKEND)
 */
const getEmptyForm = () => ({
    name: '',
    fullName: '',
    email: '',
    password: '',
    permissions: []
});

const form = ref(getEmptyForm());

/**
 * Permisos
 */
const canView = computed(() => auth.can('SYSTEM_COMPANIES_VIEW'));
const canCreate = computed(() => auth.can('SYSTEM_COMPANIES_CREATE'));
const canUpdate = computed(() => auth.can('SYSTEM_COMPANIES_EDIT'));
const canDelete = computed(() => auth.can('SYSTEM_COMPANIES_DELETE'));
/**
 * Expandir sucursales
 */
const expandedRows = ref([]);
/**
 * Load
 */
async function loadPermissions() {
    try {
        const data = await PermissionTenantService.getAll();
        tenantPermissions.value = data;
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando permisos'
        });
    }
}

async function loadCompanies() {
    if (!canView.value) return;

    loading.value = true;
    try {
        const data = await CompanyService.getAll();
        companies.value = data;
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando empresas'
        });
    } finally {
        loading.value = false;
    }
}

/**
 * Crear
 */
function openCreate() {
    if (!canCreate.value) return;

    editingCompany.value = null;
    form.value = getEmptyForm();
    selectedPermissions.value = [];
    dialogVisible.value = true;
}

/**
 * Editar
 */
// function openEdit(company) {
//     console.log(company);
//     if (!canUpdate.value) return;

//     editingCompany.value = company;

//     form.value = {
//         name: company.name
//     };
//     // 🔥 AUTOSELECCIONAR PERMISOS
//     selectedPermissions.value = company.companyPermissions.map((p) => p.permissionId);
//     dialogVisible.value = true;
// }
function openEdit(company) {
    if (!canUpdate.value) return;

    editingCompany.value = company;

    form.value = {
        name: company.name,
        fullName: company.owner?.fullName || '',
        email: company.owner?.email || '',
        password: '' // 🔥 nunca cargar real
    };

    // 🔥 IMPORTANTE (tu nuevo backend)
    selectedPermissions.value = company.permissions || [];

    dialogVisible.value = true;
}
/**
 * Validación
 */
function validateForm() {
    // 🏢 nombre empresa
    if (!form.value.name) {
        toast.add({ severity: 'warn', summary: 'Nombre requerido' });
        return false;
    }

    // 🔐 permisos (solo en CREATE)
    if (!editingCompany.value && selectedPermissions.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Debe seleccionar al menos un permiso' });
        return false;
    }

    // 👤 datos del OWNER (solo en CREATE)
    if (!editingCompany.value) {
        if (!form.value.fullName || !form.value.email || !form.value.password) {
            toast.add({ severity: 'warn', summary: 'Datos de usuario requeridos' });
            return false;
        }
    }

    return true;
}

/**
 * Guardar
 */
async function save() {
    if (!validateForm()) return;

    loading.value = true;

    try {
        let companyId;

        // 🔥 payload común
        const payload = {
            name: form.value.name,
            fullName: form.value.fullName,
            email: form.value.email,
            permissions: selectedPermissions.value
        };

        // 🔐 password opcional
        if (form.value.password && form.value.password.trim() !== '') {
            payload.password = form.value.password;
        }

        // =========================
        // 🔥 UPDATE
        // =========================
        if (editingCompany.value) {
            await CompanyService.update(editingCompany.value.id, payload);

            companyId = editingCompany.value.id;

            toast.add({
                severity: 'success',
                summary: 'Empresa actualizada'
            });
        }
        // =========================
        // 🔥 CREATE
        // =========================
        else {
            const res = await CompanyService.create({
                ...form.value,
                permissions: selectedPermissions.value
            });
            console.log('companyId', res);
            companyId = res.data.company.id;

            toast.add({
                severity: 'success',
                summary: 'Empresa creada correctamente'
            });
        }

        // =========================
        // 🔥 SUBIR LOGO (IGUAL QUE PARTNER)
        // =========================
        if (selectedLogo.value) {
            const formData = new FormData();
            formData.append('file', selectedLogo.value);

            await CompanyService.uploadLogo(companyId, formData);
        }

        dialogVisible.value = false;
        form.value = getEmptyForm();
        selectedPermissions.value = [];
        selectedLogo.value = null; // 🔥 limpiar
        logoPreview.value = null; // 🔥 limpiar

        await loadCompanies();
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'Error al guardar'
        });
    } finally {
        loading.value = false;
    }
}
async function activate(company) {
    try {
        await CompanyService.activate(company.id);

        toast.add({
            severity: 'success',
            summary: 'Empresa activada'
        });

        await loadCompanies();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al activar empresa'
        });
    }
}
/**
 * Eliminar
 */
async function remove(company) {
    if (!canDelete.value) return;

    if (!confirm(`¿Eliminar empresa ${company.name}?`)) return;

    try {
        await CompanyService.remove(company.id);

        toast.add({
            severity: 'success',
            summary: 'Empresa desactivada'
        });

        await loadCompanies();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al eliminar empresa'
        });
    }
}
function onLogoChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedLogo.value = file;
    logoPreview.value = URL.createObjectURL(file);
}
onMounted(() => {
    loadCompanies();
    loadPermissions();
});
</script>

<template>
    <div class="card">
        <!-- HEADER -->
        <Toolbar class="mb-6">
            <template #start>
                <Button v-if="canCreate" label="Nueva Empresa" icon="pi pi-plus" severity="secondary"
                    @click="openCreate" />
            </template>
        </Toolbar>

        <h3 class="mb-3">Empresas</h3>

        <!-- LISTADO -->
        <DataTable v-if="canView" v-model:expanded-rows="expandedRows" :value="companies" :loading="loading"
            data-key="id">
            <!-- 🔥 COLUMNA EXPAND -->
            <Column expander style="width: 3rem" />

            <Column field="name" header="Nombre" />

            <Column header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.isActive ? 'Activa' : 'Inactiva'"
                        :severity="data.isActive ? 'success' : 'danger'" />
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="{ data }">
                    <Button v-if="canUpdate" icon="pi pi-pencil" outlined rounded @click="openEdit(data)" />
                    <Button v-if="canDelete && data.isActive" icon="pi pi-ban" outlined rounded severity="warning"
                        @click="remove(data)" />
                    <Button v-if="canUpdate && !data.isActive" icon="pi pi-check" outlined rounded severity="success"
                        @click="activate(data)" />
                </template>
            </Column>

            <!-- 🔥 CONTENIDO AL EXPANDIR -->
            <template #expansion="slotProps">
                <BranchTable :company="slotProps.data" @reload="loadCompanies" />
            </template>

        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="Empresa" :style="{ width: '400px' }">
            <!-- ===================== -->
            <!-- NOMBRE EMPRESA -->
            <!-- ===================== -->
            <div class="field mb-3">
                <label>Nombre Empresa</label>
                <InputText v-model="form.name" class="w-full" />
            </div>
            <div class="field mb-3">
                <input type="file" accept="image/*" @change="onLogoChange" />
            </div>

            <img v-if="logoPreview" :src="logoPreview" width="80" />

            <!-- ===================== -->
            <!-- 🔥 PERMISOS (CREATE + EDIT) -->
            <!-- ===================== -->
            <div class="field mb-3">
                <label>Permisos (Módulos)</label>

                <MultiSelect v-model="selectedPermissions" :options="tenantPermissions" option-label="code"
                    option-value="id" placeholder="Seleccionar permisos" class="w-full" display="chip" />
            </div>

            <!-- ===================== -->
            <!-- 🔒 SOLO CREATE -->
            <!-- ===================== -->

            <div class="field mb-3">
                <label>Nombre Owner</label>
                <InputText v-model="form.fullName" class="w-full" />
            </div>

            <div class="field mb-3">
                <label>Email</label>
                <InputText v-model="form.email" class="w-full" />
            </div>

            <div class="field mb-3">
                <label>Password</label>
                <Password v-model="form.password" toggle-mask class="w-full" />
            </div>


            <!-- ===================== -->
            <!-- BOTONES -->
            <!-- ===================== -->
            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />

                <Button label="Guardar" :loading="loading" :disabled="editingCompany ? !canUpdate : !canCreate"
                    @click="save" />
            </div>
        </Dialog>
    </div>
</template>
