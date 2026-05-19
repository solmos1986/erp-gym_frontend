<script setup>
import Toast from 'primevue/toast';
// import { useAuthStore } from './store/auth.store';

// const auth = useAuthStore();
// if (auth.token) {
//     auth.loadUser();
// }
// console.log('App.vue', auth);
</script>

<template>
    <Toast />
    <router-view />
</template>

<style scoped></style>
