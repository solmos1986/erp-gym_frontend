<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

import PartnerService from '../../service/partner.service';
import { useAuthStore } from '../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

const props = defineProps({
    visible: Boolean,
    partner: {
        type: Object,
        default: null
    },
    mode: {
        type: String,
        default: 'GYM'
    }
});

const emit = defineEmits(['update:visible', 'saved']);

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const isGym = computed(() => props.mode === 'GYM');
watch(
    () => props.mode,
    (value) => {
        console.log('MODE =', value);
        console.log('isGym =', isGym.value);
    },
    { immediate: true }
);
const loading = ref(false);

const videoRef = ref(null);
const canvasRef = ref(null);

const imagePreview = ref(null);
const capturedBlob = ref(null);

const cameraStream = ref(null);
const cameraActive = ref(false);

const form = ref({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    type: 'CUSTOMER'
});

watch(
    () => props.partner,
    (partner) => {
        if (partner) {
            form.value = {
                name: partner.name ?? '',
                document: partner.document ?? '',
                phone: partner.phone ?? '',
                email: partner.email ?? '',
                address: partner.address ?? '',
                type: partner.type ?? 'CUSTOMER'
            };

            imagePreview.value = partner.imageUrl ?? null;
        } else {
            form.value = {
                name: '',
                document: '',
                phone: '',
                email: '',
                address: '',
                type: 'CUSTOMER'
            };

            imagePreview.value = null;
        }

        capturedBlob.value = null;

        stopCamera();
    },
    { immediate: true }
);

watch(dialogVisible, (val) => {
    if (!val) stopCamera();
});
watch(
    [() => props.visible, () => props.partner],
    ([visible, partner]) => {
        if (!visible) return;

        if (partner) {
            form.value = {
                name: partner.name ?? '',
                document: partner.document ?? '',
                phone: partner.phone ?? '',
                email: partner.email ?? '',
                address: partner.address ?? '',
                type: partner.type ?? 'CUSTOMER'
            };

            imagePreview.value = partner.imageUrl ?? null;
        } else {
            form.value = {
                name: '',
                document: '',
                phone: '',
                email: '',
                address: '',
                type: 'CUSTOMER'
            };

            imagePreview.value = null;
        }

        capturedBlob.value = null;

        stopCamera();
    },
    { immediate: true }
);
async function save() {
    if (loading.value) return;

    loading.value = true;

    try {
        if (!form.value.name) {
            toast.add({
                severity: 'warn',
                summary: 'El nombre es obligatorio',
                life: 3000
            });

            return;
        }

        if (isGym.value && !form.value.document) {
            toast.add({
                severity: 'warn',
                summary: 'El documento es obligatorio',
                life: 3000
            });

            return;
        }

        let partnerId;
        let partner;

        if (props.partner) {
            const res = await PartnerService.update(props.partner.id, form.value);

            partnerId = props.partner.id;
            partner = res.partner ?? props.partner;

            toast.add({
                severity: 'success',
                summary: 'Cliente actualizado',
                life: 3000
            });
        } else {
            const res = await PartnerService.create(form.value);

            partnerId = res.partner.id;
            partner = res.partner;

            toast.add({
                severity: 'success',
                summary: 'Cliente creado',
                life: 3000
            });
        }

        if (capturedBlob.value) {
            const formData = new FormData();

            formData.append('file', capturedBlob.value);

            await PartnerService.addImage(partnerId, formData);
        }

        dialogVisible.value = false;

        stopCamera();

        emit('saved', partner);
    } catch (e) {
        console.error(e);

        toast.add({
            severity: 'error',
            summary: e?.response?.data?.message ?? 'Error al guardar cliente',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}
// =====================
// WEBCAM
// =====================
async function startCamera() {
    try {
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
        console.error('❌ Error al iniciar cámara:', error);
    }
}

async function captureImage() {
    if (!videoRef.value || !canvasRef.value) return;

    const video = videoRef.value;
    const canvas = canvasRef.value;

    const ctx = canvas.getContext('2d');

    const FINAL_WIDTH = 500;
    const FINAL_HEIGHT = 700;

    canvas.width = FINAL_WIDTH;
    canvas.height = FINAL_HEIGHT;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    const targetRatio = FINAL_WIDTH / FINAL_HEIGHT;

    let cropWidth = sourceWidth;
    let cropHeight = cropWidth / targetRatio;

    if (cropHeight > sourceHeight) {
        cropHeight = sourceHeight;
        cropWidth = cropHeight * targetRatio;
    }

    const sx = (sourceWidth - cropWidth) / 2;
    const sy = (sourceHeight - cropHeight) / 2;

    ctx.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, FINAL_WIDTH, FINAL_HEIGHT);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));

    capturedBlob.value = blob;

    imagePreview.value = URL.createObjectURL(blob);

    stopCamera();
}

function stopCamera() {
    if (cameraStream.value) {
        cameraStream.value.getTracks().forEach((track) => track.stop());

        cameraStream.value = null;
    }

    if (videoRef.value) {
        videoRef.value.srcObject = null;
    }

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

        const FINAL_WIDTH = 500;
        const FINAL_HEIGHT = 700;

        canvas.width = FINAL_WIDTH;
        canvas.height = FINAL_HEIGHT;

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

        ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, FINAL_WIDTH, FINAL_HEIGHT);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));

        capturedBlob.value = blob;

        imagePreview.value = URL.createObjectURL(blob);
    };

    reader.readAsDataURL(file);
}

function retakePhoto() {
    imagePreview.value = null;
    capturedBlob.value = null;

    stopCamera();
}
</script>
<template>
    <Dialog v-model:visible="dialogVisible" modal header="Cliente" style="width: 400px">
        <InputText v-model="form.name" placeholder="Nombre" class="w-full mb-2" />
        <InputText v-model="form.document" placeholder="Documento" class="w-full mb-2" />
        <InputText v-model="form.phone" placeholder="Teléfono" class="w-full mb-2" />
        <InputText v-model="form.email" placeholder="Email" class="w-full mb-2" />
        <InputText v-model="form.address" placeholder="Direccion" class="w-full mb-2" />

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
                <Button v-if="!cameraActive && !imagePreview && isGym" label="Activar Cámara" @click="startCamera" />

                <!-- CAPTURAR -->
                <Button v-if="cameraActive && isGym" label="Capturar" severity="success" @click="captureImage" />

                <!-- TOMAR OTRA -->
                <Button v-if="imagePreview && isGym" label="Tomar Otra" severity="secondary" @click="retakePhoto" />

                <!-- SUBIR FOTO -->
                <FileUpload v-if="!cameraActive && !imagePreview && isGym" mode="basic" accept="image/*" choose-label="Subir Foto" custom-upload auto @uploader="onUploadPhoto" />
            </div>

            <div class="flex justify-content-end gap-2 mt-3">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" severity="success" :loading="loading" :disabled="loading" @click="save" />
            </div>
        </div>
    </Dialog>
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
