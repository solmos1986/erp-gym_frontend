<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    modelValue: Boolean,
    usuario: Object,
    companyId: Number,
    roles: Array
});

const emit = defineEmits(['update:modelValue', 'save']);
const visible = ref(false);
const form = ref({
    name: '',
    permissionIds: []
});

watch(
    () => props.modelValue,
    (val) => {
        visible.value = val;
    }
);

watch(
    () => props.role,
    (usuario) => {
        if (usuario) {
            form.value = {
                name: usuario.name,
                roleIds: usuario.role.map((rp) => rp.roleId)
            };
        } else {
            form.value = {
                name: '',
                roleIds: []
            };
        }
    },
    { immediate: true }
);

function close() {
    emit('update:modelValue', false);
}

function submit() {
    emit('save', {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        roleIds: 1,
        companyId: props.companyNum,
        branchId: form.value.roleIds
    });
    //console.log('desde dialog ', form.value.name, form.value.permissionIds, props.companyId);
}
</script>

<template>
    <Dialog v-model:visible="visible" modal header="Usuario" style="width: 450px" @hide="close">
        <div class="field mt-3">
            <label>Nombre</label>
            <InputText v-model="form.name" class="w-full" />
        </div>
        <div class="field mt-3">
            <label>Usuario</label>
            <InputText v-model="form.email" class="w-full" />
        </div>
        <div class="field mt-3">
            <label>Contraseña</label>
            <!-- <InputText v-model="form.password" class="w-full" /> -->
            <Password id="password" v-model="form.password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
        </div>
        <div class="field mt-3">
            <label>Roles</label>
            <MultiSelect v-model="form.roleIds" :options="roles" optionLabel="name" optionValue="id" class="w-full" placeholder="Seleccionar roles" />
        </div>

        <template #footer>
            <Button label="Cancelar" text @click="close" />
            <Button label="Guardar" @click="submit" />
        </template>
    </Dialog>
</template>
