<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import cashBoxService from '../../service/cashbox.service';
import cashRegisterService from '../../service/cashregister.service';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const loading = ref(false);

// Cajas físicas disponibles
const cashBoxes = ref([]);
const selectedCashBoxId = ref(null);

// Saldo inicial
const initialBalance = ref(0);

// Verificar si ya hay una sesión abierta
async function checkCashRegister() {
    try {
        await cashRegisterService.getMyOpenCashRegister();
        toast.add({
            severity: 'info',
            summary: 'Caja ya abierta',
            detail: 'Ya tienes una caja abierta, redirigiendo al POS',
            life: 2000
        });
        setTimeout(() => {
            router.push('/pos');
        }, 1500);
    } catch (e) {
        // No hay caja abierta → seguimos
    }
}

// Cargar cajas físicas disponibles
async function loadAvailableCashBoxes() {
    try {
        cashBoxes.value = await cashBoxService.getAvailable();
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las cajas disponibles',
            life: 3000
        });
    }
}

onMounted(async () => {
    await checkCashRegister();
    await loadAvailableCashBoxes();
});

// Abrir sesión de caja
async function openCashRegister() {
    if (!selectedCashBoxId.value) {
        toast.add({
            severity: 'warn',
            summary: 'Caja requerida',
            detail: 'Debe seleccionar una caja disponible',
            life: 3000
        });
        return;
    }

    try {
        loading.value = true;

        await cashRegisterService.openCashRegister({
            cashBoxId: selectedCashBoxId.value,
            initialBalance: Number(initialBalance.value)
        });

        toast.add({
            severity: 'success',
            summary: 'Caja abierta',
            detail: 'Sesión de caja iniciada correctamente',
            life: 2000
        });

        // 🔥 Volver a donde vino o usar un fallback
        const redirectTo = route.query.redirect || '/dashboard';
        router.push(redirectTo);
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error al abrir caja',
            detail: e.response?.data?.message || e.message,
            life: 4000
        });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="flex justify-center items-center min-h-[80vh]">
        <div class="bg-white shadow-xl rounded-xl p-6 w-full max-w-md">
            <div class="text-center mb-6">
                <i class="pi pi-unlock text-4xl text-green-600 mb-2"></i>
                <h2 class="text-xl font-bold">Apertura de Caja</h2>
                <p class="text-gray-500 text-sm">Seleccione una caja física disponible para iniciar su sesión</p>
            </div>

            <!-- Selección de Caja Física -->
            <div class="mb-4">
                <label class="block font-medium mb-1">Caja disponible</label>
                <Dropdown v-model="selectedCashBoxId" :options="cashBoxes" optionLabel="name" optionValue="id" placeholder="Seleccione una caja" class="w-full" />
            </div>

            <!-- Saldo inicial -->
            <div class="mb-4">
                <label class="block font-medium mb-1">Saldo inicial (Bs)</label>
                <InputNumber v-model="initialBalance" class="w-full" mode="decimal" :min="0" />
            </div>

            <Button label="Abrir Caja" icon="pi pi-check" class="w-full" severity="success" :loading="loading" @click="openCashRegister" />
        </div>
    </div>
</template>
