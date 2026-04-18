<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import BranchService from '../../service/branch.service';
import DeviceService from '../../service/device.service';

import { useAuthStore } from '../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const devices = ref([]);
const branches = ref([]);

const loading = ref(false);
const dialogVisible = ref(false);

const editingId = ref(null);

const form = ref({
    name: '',
    ip: '',
    port: 8000,
    username: '',
    password: '',
    deviceType: 'ACCESS_CONTROL',
    brand: 'HIKVISION',
    branchId: ''
});
const formatStatus = (status) => {
    if (status === 'ONLINE') return '🟢 Online';
    if (status === 'BUSY') return '🟠 Ocupado';
    if (status === 'OFFLINE') return '⚫ Offline';
    return '⚪ Desconocido';
};
// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_DEVICES_VIEW'));
const canCreate = computed(() => auth.can('TENANT_DEVICES_CREATE'));
const canEdit = computed(() => auth.can('TENANT_DEVICES_EDIT'));
const canDelete = computed(() => auth.can('TENANT_DEVICES_DELETE'));

// =====================
// CARGA
// =====================
async function loadAll() {
    loading.value = true;
    try {
        devices.value = await DeviceService.getAll();
        branches.value = await BranchService.getAll();
        console.log('branches cargados:', branches.value);
    } finally {
        loading.value = false;
    }
}

// =====================
// MODAL
// =====================
function openCreate() {
    editingId.value = null;

    form.value = {
        name: '',
        ip: '',
        port: 8000,
        username: '',
        password: '',
        deviceType: 'ACCESS_CONTROL',
        brand: 'HIKVISION',
        branchId: ''
    };

    dialogVisible.value = true;
}

function openEdit(device) {
    editingId.value = device.id;

    form.value = {
        name: device.name,
        ip: device.ip,
        port: device.port,
        username: device.username,
        password: device.password,
        deviceType: device.deviceType,
        brand: device.brand,
        branchId: device.branchId
    };

    dialogVisible.value = true;
}

// =====================
// SAVE
// =====================
async function save() {
    try {
        if (!form.value.name || !form.value.ip || !form.value.branchId) {
            toast.add({
                severity: 'warn',
                summary: 'Nombre, IP y sucursal son obligatorios',
                life: 3000
            });
            return;
        }

        if (editingId.value) {
            await DeviceService.update(editingId.value, form.value);
            toast.add({
                severity: 'success',
                summary: 'Device actualizado',
                life: 3000
            });
        } else {
            await DeviceService.create(form.value);
            toast.add({
                severity: 'success',
                summary: 'Device creado',
                life: 3000
            });
        }

        dialogVisible.value = false;
        loadAll();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: e?.response?.data?.message || 'Error guardando device',
            life: 3000
        });
    }
}

// =====================
// DELETE
// =====================
async function remove(id) {
    try {
        await DeviceService.remove(id);

        toast.add({
            severity: 'success',
            summary: 'Device eliminado',
            life: 3000
        });

        loadAll();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error eliminando device',
            life: 3000
        });
    }
}

// =====================
// INIT
// =====================
onMounted(async () => {
    await loadAll();
});
</script>

<template>
    <div class="card">
        <!-- TOOLBAR -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo Device" icon="pi pi-plus" severity="secondary" v-if="canCreate"
                    @click="openCreate" />
            </template>
        </Toolbar>

        <!-- TITLE -->
        <div class="flex justify-content-between mb-3">
            <h3>Dispositivos</h3>
        </div>

        <!-- TABLE -->
        <DataTable v-if="canView" :value="devices" :loading="loading">
            <Column field="name" header="Nombre" />
            <Column field="ip" header="IP" />

            <Column header="Sucursal">
                <template #body="{ data }">
                    {{ data.branch?.name }}
                </template>
            </Column>

            <Column field="brand" header="Marca" />
            <Column field="deviceType" header="Tipo" />
            <Column field="status" header="Estado">
                <template #body="{ data }">
                    <span
                        :class="['px-2 py-1 rounded text-xs font-semibold', data.status === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600']">
                        {{ formatStatus(data.status) }}
                    </span>
                </template>
            </Column>
            <Column header="Acciones">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" text v-if="canEdit" @click="openEdit(data)" />
                    <Button icon="pi pi-trash" text severity="danger" v-if="canDelete" @click="remove(data.id)" />
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="Device" style="width: 400px">
            <div class="field">
                <label>Nombre</label>
                <InputText v-model="form.name" class="w-full" />
            </div>

            <div class="field">
                <label>IP</label>
                <InputText v-model="form.ip" class="w-full" />
            </div>

            <div class="field">
                <label>Puerto</label>
                <InputText v-model="form.port" class="w-full" />
            </div>

            <div class="field">
                <label>Usuario</label>
                <InputText v-model="form.username" class="w-full" />
            </div>

            <div class="field">
                <label>Password</label>
                <InputText v-model="form.password" class="w-full" />
            </div>

            <div class="field">
                <label>Tipo</label>
                <Dropdown v-model="form.deviceType" :options="['ACCESS_CONTROL', 'CAMERA', 'BIOMETRIC']"
                    class="w-full" />
            </div>

            <div class="field">
                <label>Marca</label>
                <Dropdown v-model="form.brand" :options="['HIKVISION', 'ZKTECO']" class="w-full" />
            </div>

            <div class="field">
                <label>Sucursal</label>
                <Dropdown v-model="form.branchId" :options="branches" optionLabel="name" optionValue="id"
                    placeholder="Seleccionar sucursal" class="w-full" />
            </div>

            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" severity="success" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
