<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAlert } from '@/stores/alert';
import { auth } from '@/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useUserStore } from '@/stores/userStore';

const data = ref({
    email: '',
    password: ''
});

const router = useRouter();
const userStore = useUserStore();
const alertStore = useAlert(); // Crie uma instância do alertStore

async function login() {
    try {
        userStore.loading = true;

        const userCredential = await signInWithEmailAndPassword(auth, data.value.email, data.value.password);
        console.log("Login bem-sucedido:", userCredential);

        await userStore.fetchUserInfo(alertStore); // Passa o alertStore aqui
        console.log("Informações do usuário:", userStore.user);

        const role = userStore.user?.role || 'user';
        console.log("Role do usuário:", role);

        const redirectPath = role === 'admin' ? '/barber/appointments' : '/';
        alertStore.show('Login realizado com sucesso!', 'success');
        router.replace(redirectPath);
    } catch (error) {
        console.error("Erro no login:", error);
        alertStore.show('Deu algum erro no seu login, tente novamente!', 'error');
    } finally {
        userStore.loading = false;
    }
}


function goToRegister() {
    router.replace('/register');
}

function goToForgotPass() {
    router.replace('/forgot-password')
}

</script>

<template>
    <div class="container login">
        <div class="flex-grow-1">
            <div class="text-center">
                <h1 class="text-center fs-5 fw-bolder mb-0">Barbearia El Shaddai</h1>
                <p class="fs-6 text-muted">Gerenciamento de atendimentos à Barbearia</p>
            </div>
            <form @submit.prevent="login">
                <div class="mb-3">
                    <label class="form-label" for="email">Email</label>
                    <input class="form-control" id="email" v-model="data.email" type="email" placeholder="Email"
                        required />
                </div>
                <div class="mb-4">
                    <label class="form-label d-flex align-items-center" for="password">
                        <span>Senha</span>
                        <a href="javascript:void(0)" @click="goToForgotPass"
                            class="fw-bold fs-6 ms-auto text-decoration-none text-primary">
                            Esqueceu sua senha?
                        </a>
                    </label>
                    <input class="form-control" v-model="data.password" type="password" id="password"
                        placeholder="Senha" required />
                </div>
                <button type="submit"
                    class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-1"
                    :disabled="userStore.loading"> <!-- Desabilita o botão se estiver carregando -->
                    <span v-if="userStore.loading" class="spinner-border spinner-border-sm" role="status"
                        aria-hidden="true"></span>
                    <span v-else>Partiu</span>
                    <span v-if="!userStore.loading" class="material-symbols-rounded fs-5">login</span>
                </button>
                <div class="mt-3 text-center">
                    <p class="fs-6 text-muted">Ainda não tem um cadastro? <a href="javascript:void(0)"
                            @click="goToRegister" class="text-primary">Cadastre-se</a>
                    </p>
                </div>
            </form>
        </div>
    </div>
</template>


<style scoped>
.login {
    max-width: 320px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100dvh;
}
</style>
