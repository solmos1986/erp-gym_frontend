<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable no-unused-vars -->
<script setup>
import { useLayout } from '@/layout/composables/layout';
import CompanyService from '@/service/company.service';
import { useAuthStore } from '@/store/auth.store';
import { onMounted } from 'vue'; // 🔥 FALTABA ESTO

const baseUrl = import.meta.env.VITE_API_URL;

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const auth = useAuthStore();

onMounted(async () => {
    try {
        const company = await CompanyService.getById(auth.user.companyId);

        auth.user = {
            ...auth.user,
            company
        };
    } catch (error) {
        console.error(error);
    }
});

const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth/login";
};

const getLogoUrl = () => {
    if (!auth?.user?.company?.logoUrl) return null;
    return `${baseUrl}/${auth.user.company.logoUrl}`;
};
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo" style="display: flex; align-items: center; gap: 10px">
                <!-- 🔥 LOGO DINÁMICO -->
                <img v-if="auth?.user?.company?.logoUrl" :src="getLogoUrl()" style="height: 35px" />

                <!-- 🔁 FALLBACK (SAKAI) -->
                <svg v-else viewBox="0 0 54 40" width="35">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355..."
                        fill="var(--primary-color)" />
                </svg>

                <!-- 🔥 NOMBRE DINÁMICO -->
                <!-- <span>{{ auth.user?.company?.name || 'SAKAI' }}</span>-->
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button" class="layout-topbar-action layout-topbar-action-highlight">
                        <i class="pi pi-palette"></i>
                    </button>
                    <!-- <AppConfigurator /> -->
                </div>
            </div>

            <button
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                class="layout-topbar-menu-button layout-topbar-action">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>

                    <button type="button" class="layout-topbar-action" @click="logout">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
