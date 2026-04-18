<script>
import { computed, ref, watchEffect } from 'vue';
import { useUserStore } from '../../store/user.store.js';

export default {
    props: {
        userId: {
            type: Number,
            default: null
        }
    },

    setup(props) {
        const store = useUserStore();
        const user = ref({
            name: '',
            email: '',
            password: '',
            roleId: null
        });
        const roles = ref([]); // You can fetch roles from an API or store
        const isEditMode = computed(() => !!props.userId);

        // Fetch roles and user details (if editing)
        const fetchRoles = async () => {
            // Call API to fetch roles (if necessary)
            roles.value = await store.fetchRoles();
        };

        const fetchUserDetails = async () => {
            if (props.userId) {
                const userDetails = await store.fetchUser(props.userId);
                user.value = userDetails;
            }
        };

        watchEffect(() => {
            fetchRoles();
            fetchUserDetails();
        });

        const submitForm = async () => {
            if (isEditMode.value) {
                await store.updateUser(props.userId, user.value);
            } else {
                await store.createUser(user.value);
            }
        };

        return {
            user,
            roles,
            isEditMode,
            submitForm
        };
    }
};
</script>

<template>
    <div class="user-form">
        <h2>{{ formTitle }}</h2>
        <form @submit.prevent="submitForm">
            <div class="form-group">
                <label for="name">Name</label>
                <input v-model="user.name" type="text" id="name" required />
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input v-model="user.email" type="email" id="email" required />
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input v-model="user.password" type="password" id="password" required />
            </div>
            <div class="form-group">
                <label for="roleId">Role</label>
                <select v-model="user.roleId" required>
                    <option v-for="role in roles" :key="role.id" :value="role.id">
                        {{ role.name }}
                    </option>
                </select>
            </div>
            <div class="form-group">
                <button type="submit">{{ isEditMode ? 'Update' : 'Create' }} User</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
/* Your custom styles here */
</style>
