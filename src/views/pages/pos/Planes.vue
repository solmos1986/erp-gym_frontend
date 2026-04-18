<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import PlanService from '../../../service/plan.service';
import { useAuthStore } from '../../../store/auth.store';

const toast = useToast();
const auth = useAuthStore();

// =====================
// ESTADOS
// =====================
const plans = ref([]);

const loading = ref(false);
const dialogVisible = ref(false);
const editingPlan = ref(null);

const form = ref({
    name: '',
    price: null,
    durationDays: null,
    description: ''
});

// =====================
// PERMISOS
// =====================
const canView = computed(() => auth.can('TENANT_PLANS_VIEW'));
const canCreate = computed(() => auth.can('TENANT_PLANS_CREATE'));
const canUpdate = computed(() => auth.can('TENANT_PLANS_EDIT'));
const canDelete = computed(() => auth.can('TENANT_PLANS_DELETE'));

// =====================
// CARGAS
// =====================
async function loadPlans() {
    loading.value = true;
    try {
        plans.value = await PlanService.getAll();
    } finally {
        loading.value = false;
    }
}

// =====================
// CRUD
// =====================
function openCreate() {
    editingPlan.value = null;

    form.value = {
        name: '',
        price: null,
        durationDays: null,
        description: ''
    };

    dialogVisible.value = true;
}

function openEdit(plan) {
    editingPlan.value = plan;

    form.value = {
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        description: plan.description
    };

    dialogVisible.value = true;
}

async function save() {
    try {
        if (!form.value.name || !form.value.price || !form.value.durationDays) {
            toast.add({ severity: 'warn', summary: 'Complete todos los campos obligatorios', life: 3000 });
            return;
        }

        if (editingPlan.value) {
            await PlanService.update(editingPlan.value.id, form.value);
            toast.add({ severity: 'success', summary: 'Plan actualizado', life: 3000 });
        } else {
            await PlanService.create(form.value);
            toast.add({ severity: 'success', summary: 'Plan creado', life: 3000 });
        }

        dialogVisible.value = false;
        loadPlans();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error al guardar plan', life: 3000 });
    }
}

async function remove(plan) {
    if (!confirm(`¿Desactivar plan ${plan.name}?`)) return;

    await PlanService.remove(plan.id);
    toast.add({ severity: 'success', summary: 'Plan desactivado', life: 3000 });
    loadPlans();
}

// =====================
// INIT
// =====================
onMounted(async () => {
    await loadPlans();
});
</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Nuevo Plan" v-if="canCreate" icon="pi pi-plus" severity="secondary" class="mr-2"
                    @click="openCreate" />
            </template>
        </Toolbar>

        <div class="flex justify-content-between mb-3">
            <h3>Planes</h3>
        </div>

        <DataTable v-if="canView" :value="plans" :loading="loading">
            <Column field="name" header="Nombre" />
            <Column field="price" header="Precio" />
            <Column field="durationDays" header="Duración (días)" />
            <Column field="description" header="Descripción" />

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
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" modal header="Plan" style="width: 400px">
            <div class="field">
                <label>Nombre</label>
                <InputText v-model="form.name" class="w-full" />
            </div>

            <div class="field">
                <label>Precio</label>
                <InputNumber v-model="form.price" class="w-full" mode="currency" currency="BOB" />
            </div>

            <div class="field">
                <label>Duración (días)</label>
                <InputNumber v-model="form.durationDays" class="w-full" />
            </div>

            <div class="field">
                <label>Descripción</label>
                <InputText v-model="form.description" class="w-full" />
            </div>

            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" severity="success" @click="save" />
            </div>
        </Dialog>
    </div>
</template>
