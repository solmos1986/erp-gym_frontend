<script setup>
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth.store';

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const loading = ref(false);
const checked = ref(false); // ✅ FALTABA

const form = ref({
    email: 'admin@erp.com',
    password: '123456'
});

const submit = async () => {
    if (loading.value) return;

    loading.value = true;
    console.log('contenido login', form.value);

    try {
        await auth.login(form.value);
        router.push('/'); // o '/platform/companies' si es superadmin
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error de autenticación',
            detail: error?.response?.data?.message || 'Credenciales inválidas',
            life: 4000
        });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <FloatingConfigurator />

    <div
        class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenido</div>
                        <span class="text-muted-color font-medium"> Inicia sesión para continuar </span>
                    </div>

                    <div>
                        <label class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"> Email
                        </label>
                        <InputText type="email" class="w-full md:w-[30rem] mb-8" v-model="form.email" />

                        <label class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2"> Password
                        </label>
                        <!-- 🔥 AQUÍ ESTABA EL ERROR -->
                        <!-- <Password v-model:modelValue="form.password" :toggleMask="true" class="mb-4 w-full" :feedback="false" /> -->
                        <Password id="password" v-model="form.password" placeholder="Password" :toggleMask="true"
                            class="mb-4" fluid :feedback="false"></Password>
                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" binary class="mr-2" />
                                <label>Remember me</label>
                            </div>
                        </div>

                        <Button label="Sign In" class="w-full" :loading="loading" @click="submit" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
