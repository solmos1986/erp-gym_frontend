<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppMenu from './AppMenu.vue';

const { isSidebarActive } = useLayout();
</script>

<template>
    <div :class="['layout-sidebar', { active: isSidebarActive.value }]">
        <app-menu></app-menu>
    </div>
</template>

<style lang="scss" scoped></style>
