/* eslint-disable prettier/prettier */

import Aura from '@primeuix/themes/aura';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';
import { useAuthStore } from '../src/store/auth.store';
import App from './App.vue';
import router from './router';
// PrimeVue components
import 'primeicons/primeicons.css';
import StyleClass from 'primevue/styleclass';
import Toast from 'primevue/toast';
import './assets/styles.scss';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

// 🔥 IMPORTANTE: usar async wrapper
async function bootstrap() {
    const auth = useAuthStore();

    await auth.initAuth(); // 👈 AQUÍ ESTÁ LA CLAVE

    app.use(router);
    app.use(PrimeVue, {
        theme: {
            preset: Aura,
            options: {
                darkModeSelector: '.app-dark'
            }
        }
    });
    app.use(ToastService);
    app.component('Toast', Toast);
    app.use(ConfirmationService);
    app.directive('styleclass', StyleClass);

    app.mount('#app');
}

bootstrap();
