<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
//import AuthService from '../../service/auth.service'; // 🔥 nuevo
import BusinessTemplateService from '../../service/businessTemplate.service';
import CompanyService from '../../service/company.service';
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
    businessTemplateId: null
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

const businessTemplates = ref([]);
/**
 *
 *
 *
 *
 * Load
 */

async function loadCompanies() {
    if (!canView.value) return;

    loading.value = true;
    try {
        const data = await CompanyService.getAll();
        companies.value = data;
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando empresas',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}
async function loadBusinessTemplates() {
    try {
        businessTemplates.value = await BusinessTemplateService.getAll();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando tipos de empresa',
            life: 3000
        });
    }
}
/**
 * Crear
 */
function openCreate() {
    if (!canCreate.value) return;

    editingCompany.value = null;
    form.value = getEmptyForm();

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
        password: '', // 🔥 nunca cargar real
        businessTemplateId: company.businessTemplate?.id || null
    };

    dialogVisible.value = true;
}
/**
 * Validación
 */
function validateForm() {
    // 🏢 nombre empresa
    if (!form.value.name) {
        toast.add({ severity: 'warn', summary: 'Nombre requerido', life: 3000 });
        return false;
    }
    if (!form.value.businessTemplateId) {
        toast.add({
            severity: 'warn',
            summary: 'Debe seleccionar un tipo de empresa',
            life: 3000
        });

        return false;
    }

    // // 🔐 permisos (solo en CREATE)
    // if (!editingCompany.value && selectedPermissions.value.length === 0) {
    //     toast.add({ severity: 'warn', summary: 'Debe seleccionar al menos un permiso' });
    //     return false;
    // }

    // 👤 datos del OWNER (solo en CREATE)
    if (!editingCompany.value) {
        if (!form.value.email || !form.value.password) {
            toast.add({ severity: 'warn', summary: 'Datos de usuario requeridos', life: 3000 });
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
            businessTemplateId: form.value.businessTemplateId
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
                summary: 'Empresa actualizada',
                life: 3000
            });
        }
        // =========================
        // 🔥 CREATE
        // =========================
        else {
            const res = await CompanyService.create(payload);
            console.log('companyId', res);
            companyId = res.data.company.id;

            toast.add({
                severity: 'success',
                summary: 'Empresa creada correctamente',
                life: 3000
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

        selectedLogo.value = null; // 🔥 limpiar
        logoPreview.value = null; // 🔥 limpiar

        await loadCompanies();
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'Error al guardar',
            life: 3000
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
            summary: 'Empresa activada',
            life: 3000
        });

        await loadCompanies();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al activar empresa',
            life: 3000
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
            summary: 'Empresa desactivada',
            life: 3000
        });

        await loadCompanies();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al eliminar empresa',
            life: 3000
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

    loadBusinessTemplates();
});
</script>

<template>
    <div>
        <div class="flex justify-content-between mb-3">
            <h3>Empresas</h3>
        </div>

        <Toolbar class="mb-6">
            <template #start>
                <div class="flex gap-2">
                    <Button v-if="canCreate" label="Nueva Empresa" icon="pi pi-plus" severity="success" @click="openCreate" />
                </div>
            </template>
            <template #end>
                <div class="flex align-items-center gap-3">
                    <AutoComplete v-model="searchCompany" :suggestions="filteredCompanies" option-label="name" dropdown placeholder="Buscar empresas" style="width: 300px" @complete="searchCompanies">
                        <template #option="slotProps">
                            <div class="flex flex-column">
                                <span>{{ slotProps.option.name }}</span>

                                <small>
                                    {{ slotProps.option.document }}
                                </small>
                            </div>
                        </template>
                    </AutoComplete>

                    <Button label="Reset" icon="pi pi-times" severity="danger" @click="searchPartner = null" />
                </div>
            </template>
        </Toolbar>

        <div class="card mt-4">
            <DataTable v-if="canView" v-model:expanded-rows="expandedRows" :value="companies" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" striped-rows responsive-layout="scroll" data-key="id">
                <!-- 🔥 COLUMNA EXPAND -->
                <Column expander style="width: 3rem" />

                <Column field="name" header="Nombre" />
                <Column field="businessTemplate.name" header="Tipo" />
                <Column header="Estado">
                    <template #body="{ data }">
                        <Tag :value="data.isActive ? 'Activa' : 'Inactiva'" :severity="data.isActive ? 'success' : 'danger'" />
                    </template>
                </Column>

                <Column header="Acciones">
                    <template #body="{ data }">
                        <Button v-if="canUpdate" icon="pi pi-pencil" outlined rounded @click="openEdit(data)" />
                        <Button v-if="canDelete && data.isActive" icon="pi pi-ban" outlined rounded severity="warning" @click="remove(data)" />
                        <Button v-if="canUpdate && !data.isActive" icon="pi pi-check" outlined rounded severity="success" @click="activate(data)" />
                    </template>
                </Column>

                <!-- 🔥 CONTENIDO AL EXPANDIR -->
                <template #expansion="slotProps">
                    <BranchTable :company="slotProps.data" @reload="loadCompanies" />
                </template>
            </DataTable>
        </div>
        <!-- LISTADO -->

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
                <label>Tipo de Empresa</label>

                <Dropdown v-model="form.businessTemplateId" :options="businessTemplates" option-label="name" option-value="id" placeholder="Seleccione un tipo de empresa" class="w-full" />
            </div>
            <div class="field mb-3">
                <input type="file" accept="image/*" @change="onLogoChange" />
            </div>

            <img v-if="logoPreview" :src="logoPreview" width="80" />

            <!-- ===================== -->
            <!-- 🔥 PERMISOS (CREATE + EDIT) -->
            <!-- ===================== -->

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

                <Button label="Guardar" :loading="loading" :disabled="editingCompany ? !canUpdate : !canCreate" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
