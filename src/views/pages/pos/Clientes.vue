<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import PartnerService from '../../../service/partner.service';
import { useAuthStore } from '../../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const partners = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingPartner = ref(null);

const videoRef = ref(null);
const canvasRef = ref(null);
const imagePreview = ref(null);
const capturedBlob = ref(null); // 🔥 NUEVO
const cameraStream = ref(null);
const form = ref({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    type: 'CUSTOMER'
});

// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_PARTNER_VIEW'));
const canCreate = computed(() => auth.can('TENANT_PARTNER_CREATE'));
const canUpdate = computed(() => auth.can('TENANT_PARTNER_EDIT'));
const canDelete = computed(() => auth.can('TENANT_PARTNER_DELETE'));

// =====================
// CARGA
// =====================
async function loadPartners() {
    loading.value = true;
    try {
        partners.value = await PartnerService.getAll();
    } finally {
        loading.value = false;
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
    editingPartner.value = partner;
    capturedBlob.value = null;

    const mainImage = partner.images?.find((i) => i.isMain);

    form.value = {
        name: partner.name,
        document: partner.document,
        phone: partner.phone,
        email: partner.email,
        address: partner.address,
        type: partner.type
    };

    imagePreview.value = mainImage?.url || null;

    dialogVisible.value = true;
}

async function save() {
    try {
        if (!form.value.name) {
            toast.add({ severity: 'warn', summary: 'Nombre es obligatorio', life: 3000 });
            return;
        }

        let partnerId;

        if (editingPartner.value) {
            await PartnerService.update(editingPartner.value.id, form.value);
            partnerId = editingPartner.value.id;

            toast.add({ severity: 'success', summary: 'Cliente actualizado', life: 3000 });
        } else {
            const res = await PartnerService.create(form.value);
            partnerId = res.partner.id;

            toast.add({ severity: 'success', summary: 'Cliente creado', life: 3000 });
        }

        // 🔥 subir imagen si existe
        if (capturedBlob.value) {
            const formData = new FormData();
            formData.append('file', capturedBlob.value);

            console.log('SUBIENDO IMAGEN PARA:', partnerId);

            await PartnerService.addImage(partnerId, formData); // 🔥 USAR SERVICE
        }

        dialogVisible.value = false;
        stopCamera();
        await loadPartners();
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error al guardar cliente', life: 3000 });
    }
    stopCamera();
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
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    cameraStream.value = stream;
    videoRef.value.srcObject = stream;
    console.log('Cámara iniciada');
}

async function captureImage() {
    if (!videoRef.value || !canvasRef.value) return;

    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');

    canvas.width = 300;
    canvas.height = 300;

    ctx.drawImage(videoRef.value, 0, 0, 300, 300);

    let quality = 0.7;
    let blob;

    do {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        quality -= 0.1;
    } while (blob.size > 200 * 1024 && quality > 0.3);

    console.log('Peso final KB:', Math.round(blob.size / 1024));

    capturedBlob.value = blob;
    imagePreview.value = URL.createObjectURL(blob);

    // 🔥 APAGAR CÁMARA
    stopCamera();
}
function stopCamera() {
    console.log('Deteniendo cámara...');
    if (cameraStream.value) {
        cameraStream.value.getTracks().forEach((track) => track.stop());
        cameraStream.value = null;
        console.log('Cámara detenida');
    }

    if (videoRef.value) {
        videoRef.value.srcObject = null;
        console.log('Video limpiado');
    }
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
                <Button label="Nuevo Cliente" v-if="canCreate" icon="pi pi-plus" @click="openCreate" />
            </template>
        </Toolbar>

        <h3>Clientes</h3>

        <DataTable v-if="canView" :value="partners" :loading="loading">
            <Column header="Foto">
                <template #body="{ data }">
                    <img v-if="data.imageUrl" :src="data.imageUrl"
                        style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover" />
                    <span v-else>-</span>
                </template>
            </Column>

            <Column field="name" header="Nombre" />
            <Column field="document" header="Documento" />
            <Column field="phone" header="Teléfono" />
            <Column field="email" header="Email" />

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
                <video ref="videoRef" autoplay playsinline style="width: 100%" />
                <canvas ref="canvasRef" style="display: none" />

                <div class="flex gap-2 mt-2">
                    <Button label="Activar Cámara" @click="startCamera" />
                    <Button label="Capturar" severity="success" @click="captureImage" />
                </div>

                <img v-if="imagePreview" :src="imagePreview"
                    style="width: 100px; height: 100px; border-radius: 50%; margin-top: 10px" />
            </div>

            <div class="flex justify-content-end gap-2 mt-3">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" severity="success" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
