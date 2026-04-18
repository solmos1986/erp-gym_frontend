<!-- eslint-disable prettier/prettier -->
<script setup>
import Message from 'primevue/message'
import { onMounted, onUnmounted, ref } from 'vue'
import treasuryService from '../../service/treasury.service'

const loading = ref(false)
const noCashRegister = ref(false)
let intervalId = null

const dashboard = ref({
  today: { in: 0, out: 0, balance: 0 },
  yesterdayBalance: 0,
  difference: 0,
  currentBalance: 0,
  cashRegister: null
})

const loadDashboard = async () => {
  loading.value = true
  try {
    const data = await treasuryService.getDashboard()
    dashboard.value = data
    noCashRegister.value = false
  } catch (error) {
    if (error.response?.status === 400) {
      noCashRegister.value = true
    } else {
      console.error('Error cargando dashboard de caja:', error)
    }
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2
  }).format(value || 0)
}

onMounted(() => {
  loadDashboard()
  intervalId = setInterval(() => {
    loadDashboard()
  }, 30000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Header -->
        <div class="flex items-center gap-3 col-span-6">
            <h2 class="text-2xl font-semibold">Dashboard de Caja</h2>
            <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"> {{ dashboard.cashRegister?.name }} </span>
        </div>

        <!-- Mensaje sin caja -->
        <div class="col-span-12">
            <Message v-if="noCashRegister" severity="warn"> ⚠ No tienes una caja abierta. Abre una caja para ver el dashboard. </Message>
        </div>

        <!-- KPI: Ingresos -->
        <div class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="kpi-card">
                <div class="kpi-icon bg-green-500">
                    <i class="pi pi-arrow-down"></i>
                </div>
                <div class="kpi-content">
                    <span class="kpi-title">Ingresos Hoy</span>
                    <span class="kpi-value text-green-500">
                        {{ formatCurrency(dashboard.today.in) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- KPI: Egresos -->
        <div class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="kpi-card">
                <div class="kpi-icon bg-red-500">
                    <i class="pi pi-arrow-up"></i>
                </div>
                <div class="kpi-content">
                    <span class="kpi-title">Egresos Hoy</span>
                    <span class="kpi-value text-red-500">
                        {{ formatCurrency(dashboard.today.out) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- KPI: Saldo -->
        <div class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="kpi-card">
                <div class="kpi-icon bg-blue-500">
                    <i class="pi pi-wallet"></i>
                </div>
                <div class="kpi-content">
                    <span class="kpi-title">Saldo Actual</span>
                    <span class="kpi-value text-blue-500">
                        {{ formatCurrency(dashboard.currentBalance) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- KPI: Diferencia -->
        <div class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="kpi-card">
                <div class="kpi-icon" :class="dashboard.difference >= 0 ? 'bg-green-600' : 'bg-red-600'">
                    <i class="pi" :class="dashboard.difference >= 0 ? 'pi-arrow-up' : 'pi-arrow-down'"></i>
                </div>
                <div class="kpi-content">
                    <span class="kpi-title">Diferencia vs Ayer</span>

                    <span class="kpi-value" :class="dashboard.difference >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ formatCurrency(dashboard.difference) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Caja activa -->
        <div class="col-span-12">
            <span class="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"> Caja activa: {{ dashboard.cashRegister?.name || '---' }} </span>
        </div>
    </div>
</template>

<style scoped>
.kpi-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    box-shadow: var(--card-shadow);
}

.kpi-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
    margin-right: 1rem;
}

.kpi-content {
    display: flex;
    flex-direction: column;
}

.kpi-title {
    font-size: 0.75rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.kpi-value {
    font-size: 1.6rem;
    font-weight: 600;
}
</style>
