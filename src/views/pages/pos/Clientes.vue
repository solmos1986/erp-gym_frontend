<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import MembershipService from '../../../service/membership.service'; // 🔥 NUEVO
import PartnerService from '../../../service/partner.service';
import { useAuthStore } from '../../../store/auth.store';
import { formatDateTimeNoTZ } from '../../../utils/date.js'; // 🔥 NUEVO
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
const selectedPartner = ref(null);// 🔥 NUEVO
const syncing = ref({}); // 🔥 NUEVO
const videoRef = ref(null);
const canvasRef = ref(null);
const imagePreview = ref(null);
const capturedBlob = ref(null);
const cameraStream = ref(null);
const cameraActive = ref(false);
const membershipLoading = ref(false);
const form = ref({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    type: 'CUSTOMER'
});
const membershipForm = ref({
    startDate: null,
    endDate: null
});
// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_PARTNER_VIEW'));
const canCreate = computed(() => auth.can('TENANT_PARTNER_CREATE'));
const canUpdate = computed(() => auth.can('TENANT_PARTNER_EDIT'));
const canDelete = computed(() => auth.can('TENANT_PARTNER_DELETE'));
const canAssignMembership = computed(() => auth.can('TENANT_MEMBERSHIP_ASSIGN')); // 🔥 NUEVO
// =====================
// CARGA
// =====================
async function loadPartners() {
    loading.value = true;
    try {
        partners.value = await PartnerService.getAll();
        console.log('Partners cargados', partners.value);
    } finally {
        loading.value = false;
    }
}
function searchPartners(event) {

    const query = event.query.toLowerCase();

    filteredPartners.value = partners.value.filter((p) => {

        return (
            p.name?.toLowerCase().includes(query) ||
            p.document?.toLowerCase().includes(query)
        );
    });
}
const displayedPartners = computed(() => {

    let data = [];

    if (!searchPartner.value) {

        data = [...partners.value];

    } else {

        data = [searchPartner.value];
    }

    return data.sort((a, b) =>
        a.name.localeCompare(
            b.name,
            'es',
            { sensitivity: 'base' }
        )
    );
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
    }
    finally {
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
    capturedBlob.value = null;
    imagePreview.value = null;

    form.value = {
        name: '',
        document: '',
        phone: '',
        email: '',
        address: '',
        type: 'CUSTOMER'
    };

    dialogVisible.value = true;
}

function openEdit(partner) {

    stopCamera();

    editingPartner.value = partner;

    capturedBlob.value = null;

    form.value = {
        name: partner.name,
        document: partner.document,
        phone: partner.phone,
        email: partner.email,
        address: partner.address,
        type: partner.type
    };

    // 🔥 USAR imageUrl DIRECTAMENTE
    imagePreview.value = partner.imageUrl || null;

    console.log(
        '🖼️ Preview:',
        imagePreview.value
    );

    dialogVisible.value = true;
}
async function save() {

    if (loading.value) return;

    loading.value = true;

    try {

        if (!form.value.name) {
            toast.add({
                severity: 'warn',
                summary: 'Nombre es obligatorio',
                life: 3000
            });

            return;
        }

        let partnerId;

        if (editingPartner.value) {

            await PartnerService.update(
                editingPartner.value.id,
                form.value
            );

            partnerId = editingPartner.value.id;

            toast.add({
                severity: 'success',
                summary: 'Cliente actualizado',
                life: 3000
            });

        } else {

            const res = await PartnerService.create(form.value);

            partnerId = res.partner.id;

            toast.add({
                severity: 'success',
                summary: 'Cliente creado',
                life: 3000
            });
        }

        // SUBIR FOTO
        if (capturedBlob.value) {

            const formData = new FormData();

            formData.append('file', capturedBlob.value);

            await PartnerService.addImage(
                partnerId,
                formData
            );
        }

        dialogVisible.value = false;

        stopCamera();

        await loadPartners();

    } catch (e) {

        console.error(e);

        const message =
            e?.response?.data?.message ||
            'Error al guardar cliente';

        toast.add({
            severity: 'error',
            summary: message,
            life: 3000
        });
    } finally {

        loading.value = false;
    }
}

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
// WEBCAM
// =====================
async function startCamera() {

    try {

        // 🔥 LIMPIAR FOTO ANTERIOR
        imagePreview.value = null;
        capturedBlob.value = null;

        cameraActive.value = true;

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        });

        cameraStream.value = stream;

        if (videoRef.value) {
            videoRef.value.srcObject = stream;
        }

        console.log('📸 Cámara iniciada');

    } catch (error) {

        console.error(
            '❌ Error al iniciar cámara:',
            error
        );
    }
}

async function captureImage() {
    if (!videoRef.value || !canvasRef.value) return;

    const video = videoRef.value;
    const canvas = canvasRef.value;

    const ctx = canvas.getContext('2d');

    //////////////////////////////////////////
    // 🔥 RESOLUCIÓN FINAL
    //////////////////////////////////////////

    const FINAL_WIDTH = 500;
    const FINAL_HEIGHT = 700;

    canvas.width = FINAL_WIDTH;
    canvas.height = FINAL_HEIGHT;

    //////////////////////////////////////////
    // 🔥 CALCULAR CROP VERTICAL CENTRADO
    //////////////////////////////////////////

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    // proporción deseada
    const targetRatio = FINAL_WIDTH / FINAL_HEIGHT;

    let cropWidth = sourceWidth;
    let cropHeight = cropWidth / targetRatio;

    // ajustar si excede alto
    if (cropHeight > sourceHeight) {
        cropHeight = sourceHeight;
        cropWidth = cropHeight * targetRatio;
    }

    //////////////////////////////////////////
    // 🔥 CENTRAR CROP
    //////////////////////////////////////////

    const sx = (sourceWidth - cropWidth) / 2;
    const sy = (sourceHeight - cropHeight) / 2;

    //////////////////////////////////////////
    // 🔥 DIBUJAR IMAGEN FINAL
    //////////////////////////////////////////

    ctx.drawImage(
        video,
        sx,
        sy,
        cropWidth,
        cropHeight,
        0,
        0,
        FINAL_WIDTH,
        FINAL_HEIGHT
    );

    //////////////////////////////////////////
    // 🔥 EXPORTAR JPEG
    //////////////////////////////////////////

    const blob = await new Promise((resolve) =>
        canvas.toBlob(
            resolve,
            'image/jpeg',
            0.85
        )
    );

    //////////////////////////////////////////
    // 🔥 DEBUG
    //////////////////////////////////////////

    console.log('Resolución final:', FINAL_WIDTH, 'x', FINAL_HEIGHT);

    console.log(
        'Peso final KB:',
        Math.round(blob.size / 1024)
    );

    //////////////////////////////////////////
    // 🔥 PREVIEW FINAL
    //////////////////////////////////////////

    capturedBlob.value = blob;

    // 🔥 IMPORTANTE:
    // EL PREVIEW AHORA ES EXACTAMENTE
    // LA MISMA IMAGEN QUE SE GUARDA

    imagePreview.value = URL.createObjectURL(blob);

    //////////////////////////////////////////
    // 🔥 APAGAR CÁMARA
    //////////////////////////////////////////

    stopCamera();
}
function stopCamera() {

    console.log('Deteniendo cámara...');

    if (cameraStream.value) {

        cameraStream.value
            .getTracks()
            .forEach((track) => track.stop());

        cameraStream.value = null;

        console.log('📴 Cámara detenida');
    }

    if (videoRef.value) {

        videoRef.value.srcObject = null;

        console.log('🧹 Video limpiado');
    }

    // 🔥 OCULTAR PREVIEW CÁMARA
    cameraActive.value = false;
}
async function onUploadPhoto(event) {

    const file = event.files[0];

    if (!file) return;

    const img = new Image();

    const reader = new FileReader();

    reader.onload = (e) => {
        img.src = e.target.result;
    };

    img.onload = async () => {

        const canvas = document.createElement('canvas');

        const ctx = canvas.getContext('2d');

        //////////////////////////////////////
        // 🔥 FORMATO FINAL
        //////////////////////////////////////

        const FINAL_WIDTH = 500;
        const FINAL_HEIGHT = 700;

        canvas.width = FINAL_WIDTH;
        canvas.height = FINAL_HEIGHT;

        //////////////////////////////////////
        // 🔥 CALCULAR CROP
        //////////////////////////////////////

        const sourceWidth = img.width;
        const sourceHeight = img.height;

        const targetRatio = FINAL_WIDTH / FINAL_HEIGHT;

        let cropWidth = sourceWidth;
        let cropHeight = cropWidth / targetRatio;

        if (cropHeight > sourceHeight) {
            cropHeight = sourceHeight;
            cropWidth = cropHeight * targetRatio;
        }

        const sx = (sourceWidth - cropWidth) / 2;
        const sy = (sourceHeight - cropHeight) / 2;

        //////////////////////////////////////
        // 🔥 DIBUJAR
        //////////////////////////////////////

        ctx.drawImage(
            img,
            sx,
            sy,
            cropWidth,
            cropHeight,
            0,
            0,
            FINAL_WIDTH,
            FINAL_HEIGHT
        );

        //////////////////////////////////////
        // 🔥 EXPORTAR JPEG
        //////////////////////////////////////

        const blob = await new Promise((resolve) =>
            canvas.toBlob(
                resolve,
                'image/jpeg',
                0.85
            )
        );

        //////////////////////////////////////
        // 🔥 PREVIEW
        //////////////////////////////////////

        capturedBlob.value = blob;

        imagePreview.value =
            URL.createObjectURL(blob);

        console.log(
            '📷 Foto subida normalizada:',
            Math.round(blob.size / 1024),
            'KB'
        );
    };

    reader.readAsDataURL(file);
}
function retakePhoto() {

    // 🔥 LIMPIAR FOTO
    imagePreview.value = null;

    capturedBlob.value = null;

    // 🔥 APAGAR CÁMARA
    stopCamera();
}
// =====================
// INIT
// =====================
onMounted(async () => {
    await loadPartners();
});
watch(dialogVisible, (val) => {
    if (!val) stopCamera();
});
</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button v-if="canCreate" label="Nuevo Cliente" icon="pi pi-plus" @click="openCreate" />
            </template>
            <template #end>

                <div class="flex align-items-center gap-3">

                    <AutoComplete v-model="searchPartner" :suggestions="filteredPartners" option-label="name" dropdown
                        placeholder="Buscar cliente" style="width: 300px" @complete="searchPartners">

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

        <h3>Clientes</h3>

        <DataTable v-if="canView" :value="displayedPartners" :loading="loading" paginator :rows="10"
            :rows-per-page-options="[10, 20, 50]" responsive-layout="scroll">
            <Column header="Foto">
                <template #body="{ data }">
                    <img v-if="data.imageUrl" :src="data.imageUrl"
                        style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover" />
                    <span v-else>-</span>
                </template>
            </Column>
            <Column field="document" header="Documento" />
            <Column field="name" header="Nombre" />
            <!-- 🔥 NUEVO -->
            <Column header="Inicio">
                <template #body="{ data }">
                    {{
                        data.membership?.startDate
                            ? formatDateTimeNoTZ(
                                data.membership.startDate
                            )
                    : '-'
                    }}
                </template>
            </Column>

            <Column header="Fin">
                <template #body="{ data }">
                    {{
                        data.membership?.endDate
                            ? formatDateTimeNoTZ(
                                data.membership.endDate
                            )
                    : '-'
                    }}
                </template>
            </Column>
            <Column header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.isActive ? 'Activo' : 'Inactivo'"
                        :severity="data.isActive ? 'success' : 'danger'" />
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="{ data }">
                    <Button v-if="canUpdate" icon="pi pi-pencil" text @click="openEdit(data)" />
                    <Button v-if="canDelete" icon="pi pi-trash" text severity="danger" @click="remove(data)" />
                    <Button v-if="!data.isActive" icon="pi pi-check" text severity="success" @click="activate(data)" />
                    <!-- ➕ SI NO TIENE MEMBERSHIP -->
                    <Button v-if="!(data.membership?.length) && canAssignMembership" icon="pi pi-plus"
                        severity="success" text @click="openMembershipDialog(data)" />
                    <Button v-if="data.membership" icon="pi pi-sync" severity="secondary" text
                        :loading="syncing[data.id]" @click="syncMembership(data.id)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dialogVisible" modal header="Cliente" style="width: 400px">
            <InputText v-model="form.name" placeholder="Nombre" class="w-full mb-2" />
            <InputText v-model="form.document" placeholder="Documento" class="w-full mb-2" />
            <InputText v-model="form.phone" placeholder="Teléfono" class="w-full mb-2" />
            <InputText v-model="form.email" placeholder="Email" class="w-full mb-2" />
            <InputText v-model="form.address" placeholder="Dirección" class="w-full mb-2" />

            <div class="field">

                <div v-if="cameraActive && !imagePreview" class="camera-container">
                    <video ref="videoRef" autoplay playsinline muted class="camera-video" />

                    <!-- 🔥 GUÍA VISUAL -->
                    <div class="face-guide"></div>
                </div>

                <canvas ref="canvasRef" style="display: none" />
                <!-- PREVIEW -->
                <div v-if="imagePreview" class="preview-container">
                    <img :src="imagePreview" class="preview-image" />
                </div>
                <!-- BOTONES -->
                <div class="camera-actions">

                    <!-- ACTIVAR -->
                    <Button v-if="!cameraActive && !imagePreview" label="Activar Cámara" @click="startCamera" />

                    <!-- CAPTURAR -->
                    <Button v-if="cameraActive" label="Capturar" severity="success" @click="captureImage" />

                    <!-- TOMAR OTRA -->
                    <Button v-if="imagePreview" label="Tomar Otra" severity="secondary" @click="retakePhoto" />

                    <!-- SUBIR FOTO -->
                    <FileUpload v-if="!cameraActive && !imagePreview" mode="basic" accept="image/*"
                        choose-label="Subir Foto" custom-upload auto @uploader="onUploadPhoto" />

                </div>




                <div class="flex justify-content-end gap-2 mt-3">
                    <Button label="Cancelar" text @click="dialogVisible = false" />
                    <Button label="Guardar" severity="success" :loading="loading" :disabled="loading" @click="save" />
                </div>
            </div>
        </Dialog>
        <!-- 🔥 DIALOG MEMBERSHIP -->
        <Dialog v-model:visible="membershipDialog" modal header="Asignar Membresía" style="width: 300px">

            <div class="flex flex-column gap-2">
                <Calendar v-model="membershipForm.startDate" date-format="dd/mm/yy" placeholder="Fecha inicio" />
                <Calendar v-model="membershipForm.endDate" date-format="dd/mm/yy" placeholder="Fecha fin" />
            </div>

            <div class="flex justify-content-end gap-2 mt-3">
                <Button label="Cancelar" text @click="membershipDialog = false" />
                <Button label="Guardar" severity="success" :loading="membershipLoading" :disabled="membershipLoading"
                    @click="assignMembership" />
            </div>

        </Dialog>
    </div>
</template>
<style scoped>
.camera-container {
    width: 180px;
    height: 250px;

    margin: 0 auto;

    position: relative;

    overflow: hidden;

    border-radius: 16px;

    background: black;
}

/* VIDEO */
.camera-video {
    width: 100%;
    height: 100%;

    object-fit: cover;

    transform: scaleX(-1);
}

/* GUÍA */
.face-guide {
    position: absolute;

    top: 12px;
    left: 12px;
    right: 12px;
    bottom: 12px;

    border: 2px dashed rgba(255, 255, 255, 0.7);

    border-radius: 18px;

    pointer-events: none;
}

/* BOTONES */
.camera-actions {
    display: flex;

    justify-content: center;

    gap: 10px;

    margin-top: 10px;
}

/* PREVIEW */
.preview-container {
    margin-top: 12px;

    display: flex;

    justify-content: center;
}

.preview-image {
    width: 120px;
    height: 170px;

    object-fit: cover;

    border-radius: 12px;

    border: 3px solid #22c55e;
}
</style>
