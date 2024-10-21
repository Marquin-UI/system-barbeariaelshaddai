<script setup>
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'vue-router';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import LOCAL_AVATAR_MALE from '@/assets/avatars/avatar-boy.png';
import LOCAL_AVATAR_FEMALE from '@/assets/avatars/avatar-girl.png';

const AVATAR_BASE_URL_MALE = 'https://avatar.iran.liara.run/public/boy?username=';
const AVATAR_BASE_URL_FEMALE = 'https://avatar.iran.liara.run/public/girl?username=';

const userStore = useUserStore();
const router = useRouter();
const avatarSrc = ref('');
const userOptionsVisible = ref(false);
const userType = ref('');
const formattedLastLogin = ref('');


const toggleUserOptions = () => {
    userOptionsVisible.value = !userOptionsVisible.value;
};

const formatLastLogin = (timestamp) => {
    if (!timestamp) return 'Data indisponível';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const setAvatarSrc = (username, gender = 'male') => {
    if (!username) return;
    const baseUrl = gender === 'female' ? AVATAR_BASE_URL_FEMALE : AVATAR_BASE_URL_MALE;

    const img = new Image();
    img.src = `${baseUrl}${username}`;
    img.onload = () => {
        avatarSrc.value = img.src;
    };
    img.onerror = () => {
        avatarSrc.value = gender === 'female' ? LOCAL_AVATAR_FEMALE : LOCAL_AVATAR_MALE;
    };
};

const updateUserInfo = () => {
    if (userStore.user) {
        userType.value = userStore.user?.role === 'admin' ? 'Administrador' : 'Cliente';
        formattedLastLogin.value = formatLastLogin(userStore.lastLogin);
        const username = userStore.user?.name || 'User';
        const gender = userStore.user?.gender || 'male';
        setAvatarSrc(username, gender);
    } else {
        avatarSrc.value = ''; // Limpa o avatar se não houver dados do usuário
    }
};

const goToProfile = () => {
    router.replace('/perfil'); // Corrigido o caminho da rota
};
onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await userStore.fetchUserInfo();
            updateUserInfo();
        } else {
            router.push('/login');
        }
    });
});

watch(() => userStore.user, () => {
    updateUserInfo();
}, { immediate: true });

const logout = async () => {
    const confirmed = window.confirm('Você tem certeza que deseja sair?');
    if (confirmed) {
        try {
            await userStore.logout();
            router.replace('/login');
        } catch (error) {
            console.error('Erro ao tentar sair: ', error);
        }
    }
};
</script>

<template>
    <header class="d-flex w-100 align-items-center justify-content-between px-3 py-2">
        <div class="d-flex align-items-center gap-2">

            <a href="/" class="text-decoration-none text-dark fs-4 fw-bold">Barbearia El Shaddai</a>
        </div>

        <div class="dropdown position-relative">
            <img :src="avatarSrc" alt="Avatar" class="rounded-circle" width="45" height="45" @click="toggleUserOptions"
                style="cursor: pointer;" />

            <div v-if="userOptionsVisible" class="dropdown-menu-custom">
                <div class="profile-header d-flex align-items-center p-3">
                    <img :src="avatarSrc" alt="Avatar" class="rounded-circle me-3" width="55" height="55" />
                    <div>
                        <h5 class="mb-0 fs-6">{{ userStore.user?.name || 'Usuário' }}</h5>
                        <small class="fs-6">{{ userStore.user?.email || 'email@example.com' }}</small>
                    </div>
                </div>
                <div class="profile-body p-1">
                    <!-- Novo item: Ir para o perfil -->
                    <div class="dropdown-item d-flex align-items-start gap-2 p-2" @click="goToProfile">
                        <span class="material-symbols-rounded"> person </span>
                        <div>
                            <h6 class="mb-0">Perfil</h6>
                            <small>Ver informações do perfil</small>
                        </div>
                    </div>

                    <!-- Tipo de Usuário -->
                    <div class="dropdown-item d-flex align-items-start gap-2 p-2">
                        <span class="material-symbols-rounded"> account_circle </span>
                        <div>
                            <h6 class="mb-0">Tipo de Usuário</h6>
                            <small>{{ userType }}</small>
                        </div>
                    </div>

                    <!-- Último Acesso -->
                    <div class="dropdown-item d-flex align-items-start gap-2 p-2">
                        <span class="material-symbols-rounded"> schedule </span>
                        <div>
                            <h6 class="mb-0">Último Acesso</h6>
                            <small>{{ formattedLastLogin }}</small>
                        </div>
                    </div>
                </div>

                <div class="profile-footer text-start">
                    <a class="dropdown-item d-flex align-items-center p-3 gap-1" href="#" @click="logout">
                        <span class="material-symbols-rounded"> logout </span>
                        <div>
                            <h6 class="mb-0">Fazer Log out</h6>
                            <small>Sair com segurança</small>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </header>
</template>

<style lang="scss" scoped>
header {
    position: relative;
    width: 100%;
    background-color: #f8f9fa;

    h2 {
        font-size: 1.2rem;
        font-weight: bold;
        margin: 0;
        color: #333;
    }
}

.input-group-text {
    background-color: #f1f3f5;
}

.dropdown-menu-custom {
    position: absolute;
    top: 60px;
    right: 0;
    width: 260px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    animation: fadeIn 0.3s ease-in-out;
}

.profile-header {
    border-bottom: 1px solid #ddd;
    background-color: $body-bg-secondary;
}

.profile-header div {
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.profile-header h5 {
    font-weight: 600;
    color: #333;
}

.profile-header small {
    color: #888;
}

.profile-body {
    padding: 10px 0;
}

.dropdown-item {
    padding: 10px 15px;
    font-size: 14px;
    color: #333;
    transition: background-color 0.2s;
}

.dropdown-item:hover {
    background-color: #f1f3f5;
}

.material-symbols-rounded {
    font-size: 1.5rem;
}

.profile-footer {
    border-top: 1px solid #ddd;
    background-color: $body-bg-secondary;
}

.theme-switcher {
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>