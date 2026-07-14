<script setup>
import PartnerDialog from '@/components/partners/PartnerDialog.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import MembershipService from '../../../service/membership.service'; // 🔥 NUEVO
import PartnerService from '../../../service/partner.service';
import { useAuthStore } from '../../../store/auth.store';
import { formatDateTimeNoTZ2 } from '../../../utils/date.js'; // 🔥 NUEVO
const toast = useToast();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const partners = ref([]);
const filteredPartners = ref([]);
const searchPartner = ref(null);
const loading = ref(false);
const dialogVisible = ref(false);
const editingPartner = ref(null);
const membershipDialog = ref(false); // 🔥 NUEVO
const selectedPartner = ref(null); // 🔥 NUEVO
const syncing = ref({}); // 🔥 NUEVO
const membershipLoading = ref(false);
const membershipForm = ref({
    startDate: null,
    endDate: null
});
const fileupload = ref();
const showImportDialog = ref(false);
// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_PARTNER_VIEW'));
const canCreate = computed(() => auth.can('TENANT_PARTNER_CREATE'));
const canUpdate = computed(() => auth.can('TENANT_PARTNER_EDIT'));
const canDelete = computed(() => auth.can('TENANT_PARTNER_DELETE'));
const canAssignMembership = computed(() => auth.can('TENANT_MEMBERSHIP_ASSIGN')); // 🔥 NUEVO
const isGym = computed(() => auth.can('TENANT_MEMBERSHIP_VIEW'));
// =====================
// CARGA
// =====================
async function loadPartners() {
    loading.value = true;

    try {
        partners.value = await PartnerService.getAll({
            type: 'CUSTOMER'
        });

        console.log('Customers cargados', partners.value);
    } finally {
        loading.value = false;
    }
}
function upload() {
    fileupload.value.upload();
}
async function uploadExcel(event) {
    try {
        const file = event.files[0];

        const formData = new FormData();
        formData.append('file', file);

        const response = await PartnerService.importExcel(formData);

        toast.add({
            severity: 'success',
            summary: 'Importación completada',
            detail: `Clientes: ${response.imported}
                Membresías: ${response.memberships}
                Omitidos: ${response.skipped}`,
            life: 5000
        });
        showImportDialog.value = false;
        loadPartners();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message ?? 'Error importando'
        });
    }
}
function searchPartners(event) {
    const query = event.query.toLowerCase();

    filteredPartners.value = partners.value.filter((p) => {
        return p.name?.toLowerCase().includes(query) || p.document?.toLowerCase().includes(query);
    });
}
const displayedPartners = computed(() => {
    let data = [];

    if (!searchPartner.value) {
        data = [...partners.value];
    } else {
        data = [searchPartner.value];
    }

    return data.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
});
// =====================
// MEMBERSHIP
// =====================
function normalizeStartDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function normalizeEndDate(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
function openMembershipDialog(partner) {
    selectedPartner.value = partner;

    membershipForm.value = {
        startDate: null,
        endDate: null
    };

    membershipDialog.value = true;
}
async function assignMembership() {
    try {
        if (membershipLoading.value) return;

        membershipLoading.value = true;
        if (!membershipForm.value.startDate || !membershipForm.value.endDate) {
            toast.add({ severity: 'warn', summary: 'Fechas obligatorias', life: 3000 });
            return;
        }

        await MembershipService.assign({
            customerId: selectedPartner.value.id,
            startDate: normalizeStartDate(membershipForm.value.startDate),
            endDate: normalizeEndDate(membershipForm.value.endDate)
        });

        toast.add({ severity: 'success', summary: 'Membresía asignada', life: 3000 });

        membershipDialog.value = false;
        await loadPartners();
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error asignando membresía', life: 3000 });
    } finally {
        membershipLoading.value = false;
    }
}

//==========
// SYNC
//==========
async function syncMembership(customerId) {
    syncing.value[customerId] = true;

    try {
        await MembershipService.sync(customerId);

        toast.add({
            severity: 'success',
            summary: 'Sincronizado',
            detail: 'Cliente actualizado en dispositivo',
            life: 3000
        });
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo sincronizar',
            life: 3000
        });
    } finally {
        syncing.value[customerId] = false;
    }
}
// =====================
// CRUD
// =====================
function openCreate() {
    editingPartner.value = null;

    dialogVisible.value = true;
}

function openEdit(partner) {
    editingPartner.value = partner;

    dialogVisible.value = true;
}
async function onPartnerSaved() {
    editingPartner.value = null;

    dialogVisible.value = false;

    await loadPartners();
}
// async function save() {
//     if (loading.value) return;

//     loading.value = true;

//     try {
//         if (!form.value.name) {
//             toast.add({
//                 severity: 'warn',
//                 summary: 'El nombre es obligatorio',
//                 life: 3000
//             });
//             return;
//         }

//         if (isGym.value && !form.value.document) {
//             toast.add({
//                 severity: 'warn',
//                 summary: 'El documento es obligatorio',
//                 life: 3000
//             });
//             return;
//         }

//         let partnerId;

//         if (editingPartner.value) {
//             await PartnerService.update(editingPartner.value.id, form.value);

//             partnerId = editingPartner.value.id;

//             toast.add({
//                 severity: 'success',
//                 summary: 'Cliente actualizado',
//                 life: 3000
//             });
//         } else {
//             const res = await PartnerService.create(form.value);

//             partnerId = res.partner.id;

//             toast.add({
//                 severity: 'success',
//                 summary: 'Cliente creado',
//                 life: 3000
//             });
//         }

//         // SUBIR FOTO
//         if (capturedBlob.value) {
//             const formData = new FormData();

//             formData.append('file', capturedBlob.value);

//             await PartnerService.addImage(partnerId, formData);
//         }

//         dialogVisible.value = false;

//         stopCamera();

//         await loadPartners();
//     } catch (e) {
//         console.error(e);

//         const message = e?.response?.data?.message || 'Error al guardar cliente';

//         toast.add({
//             severity: 'error',
//             summary: message,
//             life: 3000
//         });
//     } finally {
//         loading.value = false;
//     }
// }

async function remove(partner) {
    if (!confirm(`¿Desactivar cliente ${partner.name}?`)) return;

    await PartnerService.remove(partner.id);
    toast.add({ severity: 'success', summary: 'Cliente desactivado', life: 3000 });
    loadPartners();
}

async function activate(partner) {
    await PartnerService.activate(partner.id);

    toast.add({
        severity: 'success',
        summary: 'Cliente activado',
        life: 3000
    });

    loadPartners();
}

// =====================
// INIT
// =====================
onMounted(async () => {
    await loadPartners();
});
// watch(dialogVisible, (val) => {
//     if (!val) stopCamera();
// });
</script>

<template>
    <div>
        <div class="flex justify-content-between mb-1">
            <h3>Clientes</h3>
        </div>
        <Toolbar class="mb-6">
            <template #start>
                <div class="flex gap-2">
                    <Button v-if="canCreate" label="Nuevo Cliente" icon="pi pi-plus" @click="openCreate" />
                    <Button v-if="canAssignMembership" severity="secondary" label="Importar Excel" icon="pi pi-upload" @click="showImportDialog = true" />
                </div>
            </template>
            <template #end>
                <div class="flex align-items-center gap-3">
                    <AutoComplete v-model="searchPartner" :suggestions="filteredPartners" option-label="name" dropdown placeholder="Buscar cliente" style="width: 300px" @complete="searchPartners">
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
            <DataTable v-if="canView" :value="displayedPartners" :loading="loading" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" striped-rows responsive-layout="scroll">
                <Column v-if="isGym" header="Foto">
                    <template #body="{ data }">
                        <img v-if="data.imageUrl" :src="data.imageUrl" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover" />
                        <span v-else>-</span>
                    </template>
                </Column>
                <Column field="name" header="Nombre" />
                <Column field="document" header="Documento" />

                <!-- 🔥 NUEVO -->
                <Column v-if="isGym" header="Inicio">
                    <template #body="{ data }">
                        {{ data.membership?.startDate ? formatDateTimeNoTZ2(data.membership.startDate) : '-' }}
                    </template>
                </Column>

                <Column v-if="isGym" header="Fin">
                    <template #body="{ data }">
                        {{ data.membership?.endDate ? formatDateTimeNoTZ2(data.membership.endDate) : '-' }}
                    </template>
                </Column>
                <Column header="Estado">
                    <template #body="{ data }">
                        <Tag :value="data.isActive ? 'Activo' : 'Inactivo'" :severity="data.isActive ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column v-if="isGym" header="Membresía">
                    <template #body="{ data }">
                        <Tag :value="data.membership?.status || 'SIN MEMBRESÍA'" :severity="data.membership?.status === 'ACTIVE' ? 'success' : data.membership?.status === 'EXPIRED' ? 'danger' : 'warning'" />
                    </template>
                </Column>

                <Column header="Acciones">
                    <template #body="{ data }">
                        <Button v-if="canUpdate" icon="pi pi-pencil" text @click="openEdit(data)" />
                        <Button v-if="canDelete" icon="pi pi-trash" text severity="danger" @click="remove(data)" />
                        <Button v-if="!data.isActive" icon="pi pi-check" text severity="success" @click="activate(data)" />
                        <!-- ➕ SI NO TIENE MEMBERSHIP -->
                        <Button v-if="!data.membership?.length && canAssignMembership" icon="pi pi-plus" severity="success" text @click="openMembershipDialog(data)" />
                        <Button v-if="data.membership" icon="pi pi-sync" severity="secondary" text :loading="syncing[data.id]" @click="syncMembership(data.id)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <PartnerDialog v-model:visible="dialogVisible" :partner="editingPartner" mode="GYM" @saved="onPartnerSaved" />
        <Dialog v-model:visible="membershipDialog" modal header="Asignar Membresía" style="width: 300px">
            <div class="flex flex-column gap-2">
                <Calendar v-model="membershipForm.startDate" date-format="dd/mm/yy" placeholder="Fecha inicio" />
                <Calendar v-model="membershipForm.endDate" date-format="dd/mm/yy" placeholder="Fecha fin" />
            </div>

            <div class="flex justify-content-end gap-2 mt-3">
                <Button label="Cancelar" text @click="membershipDialog = false" />
                <Button label="Guardar" severity="success" :loading="membershipLoading" :disabled="membershipLoading" @click="assignMembership" />
            </div>
        </Dialog>
        <Dialog v-model:visible="showImportDialog" header="Migración inicial" modal :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <p>Importar clientes y membresías desde Excel</p>
                <FileUpload
                    ref="fileupload"
                    mode="basic"
                    name="file"
                    accept=".xlsx,.xls"
                    :max-file-size="5000000"
                    custom-upload
                    choose-label="Seleccionar Excel"
                    empty-file-label="Ningún archivo seleccionado"
                    selected-file-label="Archivo listo"
                    @uploader="uploadExcel"
                />
                <div class="flex justify-end gap-2">
                    <Button label="Cancelar" severity="secondary" @click="showImportDialog = false" />
                    <Button label="Importar" icon="pi pi-upload" @click="upload" />
                </div>
            </div>
        </Dialog>
    </div>
</template>
