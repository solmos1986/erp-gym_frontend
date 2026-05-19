<script setup>
// import { useAuthStore } from '@/store/auth.store';
// const auth = useAuthStore();
// const { company } = defineProps({
//     company: {
//         type: Object,
//         required: true
//     }
// });
// async function downloadAgent(branch) {
//     alert("Se descargarán 2 archivos: agent.exe y config.local.json");
//     // 🔹 EXE (forzado con <a>)
//     const exeLink = document.createElement("a");
//     exeLink.href = "https://apigymcloud.aplus-security.com/agent/download-exe";
//     exeLink.download = "agent.exe";
//     exeLink.click();

//     // 🔹 CONFIG
//     const response = await fetch(
//         `https://apigymcloud.aplus-security.com/agent/download/${branch.id}`,
//         {
//             headers: {
//                 Authorization: `Bearer ${auth.token}`
//             }
//         }
//     );

//     const blob = await response.blob();
//     const url = window.URL.createObjectURL(blob);

//     const configLink = document.createElement("a");
//     configLink.href = url;
//     configLink.download = "config.local.json";
//     configLink.click();
// }
import BranchService from '@/service/branch.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';

const toast = useToast();
const auth = useAuthStore();

const { company } = defineProps({
    company: {
        type: Object,
        required: true
    }
});

// 🔥 emitir para recargar
const emit = defineEmits(['reload']);

// 🔐 permisos
const canUpdate = computed(() => auth.can('SYSTEM_COMPANIES_EDIT'));

// =========================
// 🏢 CREAR SUCURSAL
// =========================
const dialogVisible = ref(false);

const form = ref({
    name: ''
});

function openCreateBranch() {
    form.value = { name: '' };
    dialogVisible.value = true;
}

async function saveBranch() {
    if (!form.value.name) {
        toast.add({ severity: 'warn', summary: 'Nombre requerido' });
        return;
    }

    try {
        await BranchService.create({
            name: form.value.name,
            companyId: company.id
        });

        toast.add({
            severity: 'success',
            summary: 'Sucursal creada'
        });

        dialogVisible.value = false;

        // 🔥 recargar empresas
        emit('reload');

    } catch (e) {
        toast.add({
            severity: 'error',
            summary: e.response?.data?.message || 'Error creando sucursal'
        });
    }
}

// =========================
// 📥 AGENT
// =========================
async function downloadAgent(branch) {
    alert("Se descargarán 2 archivos: agent.exe y config.local.json");

    const exeLink = document.createElement("a");
    exeLink.href = "https://apigymcloud.aplus-security.com/agent/download-exe";
    exeLink.download = "agent.exe";
    exeLink.click();

    const response = await fetch(
        `https://apigymcloud.aplus-security.com/agent/download/${branch.id}`,
        {
            headers: {
                Authorization: `Bearer ${auth.token}`
            }
        }
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const configLink = document.createElement("a");
    configLink.href = url;
    configLink.download = "config.local.json";
    configLink.click();
}
</script>

<!--<template>
    <div class="p-3 bg-gray-50 border-round">
        <h5 class="mb-3">Sucursales</h5>

        <DataTable :value="company.branches">
            <Column field="name" header="Nombre" />

            <Column header="Acciones">
                <template #body="slotProps">
                    <div class="flex gap-2" style="pointer-events: auto;">-->
<!-- AGENT -->
<!-- <Button type="button" icon="pi pi-download" label="Agent"
                            @click.stop="downloadAgent(slotProps.data)" />

                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template> -->
<template>
    <div class="p-3 bg-gray-50 border-round">
        <Toolbar class="mb-6">
            <template #start>
                <h5>Sucursales</h5>
            </template>
            <template #end>
                <Button v-if="canUpdate" label="Nueva Sucursal" icon="pi pi-plus" size="small"
                    @click="openCreateBranch" />
            </template>
        </Toolbar>
        <!-- HEADER -->


        <!-- TABLA -->
        <DataTable :value="company.branches">
            <Column field="name" header="Nombre" />

            <Column header="Acciones">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button type="button" icon="pi pi-download" label="Agent"
                            @click.stop="downloadAgent(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- DIALOG -->
        <Dialog v-model:visible="dialogVisible" header="Nueva Sucursal" modal style="width: 300px;">
            <div class="field mb-3">
                <label>Nombre</label>
                <InputText v-model="form.name" class="w-full" />
            </div>

            <div class="flex justify-content-end gap-2">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" @click="saveBranch" />
            </div>
        </Dialog>

    </div>
</template>
