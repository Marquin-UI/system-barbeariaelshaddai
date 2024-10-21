@@ -0,0 +1,179 @@
<template>
    <div class="profile-page container py-4">
        <div class="profile-header d-flex flex-column align-items-center p-4">
            <img :src="avatarSrc" alt="Avatar" class="rounded-circle" width="120" height="120" />
            <h4 class="mt-3">{{ userStore.user?.name || 'Usuário' }}</h4>
            <p>{{ userStore.user?.email || 'email@example.com' }}</p>
            <small class="text-muted">{{ userType }}</small>
        </div>

        <div class="profile-body row mt-4">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">Informações Pessoais</h6>
                        <p><strong>Nome:</strong> {{ userStore.user?.name || 'Não disponível' }}</p>
                        <p><strong>Email:</strong> {{ userStore.user?.email || 'Não disponível' }}</p>
                        <p><strong>Telefone:</strong> {{ userStore.user?.phone || 'Não disponível' }}</p>
                        <p><strong>Criado em:</strong> {{ formatCreatedAt(userStore.user?.createdAt) }}</p>
                        <p><strong>Último Acesso:</strong> {{ formattedLastLogin }}</p>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">Preferências</h6>
                        <p><strong>Tipo de Usuário:</strong> {{ userType }}</p>
                        <p><strong>Notificações:</strong>Desabilitado</p>
                    </div>
                </div>

                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">Configurações</h6>

                        <button @click="logout" class="btn btn-outline-danger d-flex align-items-center gap-1"> <span
                                class="material-symbols-rounded">logout</span> Fazer Log out</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

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
const avatarSrc = ref(LOCAL_AVATAR_MALE); // Valor padrão
const userType = ref('');
const formattedLastLogin = ref('');

// Funções para formatação de data
const formatCreatedAt = (timestamp) => {
    if (!timestamp) return 'Data indisponível';

    // Verifica se o timestamp é um objeto do Firestore
    if (timestamp && typeof timestamp.toMillis === 'function') {
        timestamp = timestamp.toMillis();
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
        return 'Data inválida';
    }

    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const formatLastLogin = (timestamp) => {
    if (!timestamp) return 'Data indisponível';

    if (timestamp && typeof timestamp.toMillis === 'function') {
        timestamp = timestamp.toMillis();
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
        return 'Data inválida';
    }

    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};



// Função para definir a fonte do avatar
const setAvatarSrc = (username, gender = 'male') => {
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

// Atualiza as informações do usuário
const updateUserInfo = () => {
    if (userStore.user) {
        userType.value = userStore.user?.role === 'admin' ? 'Administrador' : 'Cliente';
        formattedLastLogin.value = formatLastLogin(userStore.lastLogin);
        const username = userStore.user?.name || 'User';
        const gender = userStore.user?.gender || 'male';
        setAvatarSrc(username, gender);
    }
};

onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await userStore.fetchUserInfo(); // Espera as informações do usuário serem carregadas
            updateUserInfo();
        } else {
            router.push('/login'); // Redireciona se não houver usuário
        }
    });
});

// Observa alterações no usuário
watch(() => userStore.user, () => {
    updateUserInfo();
}, { immediate: true });

const logout = async () => {
    const confirmed = window.confirm('Você tem certeza que deseja sair?');
    if (confirmed) {
        try {
            await userStore.logout(); // Chama a função de logout
            router.replace('/login'); // Redireciona para login após logout
        } catch (error) {
            console.error('Erro ao tentar sair: ', error);
        }
    }
};
</script>

<style scoped>
.profile-page {
    max-width: 900px;
    margin: 0 auto;
}

.profile-header {
    background-color: #f8f9fa;
    padding: 20px;
    text-align: center;
}

.card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-body {
    padding: 20px;
}

.card-title {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 15px;
}
</style>