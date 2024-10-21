<template>
    <div class="">
        <div class="header mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                <h4 class="title mb-3 mb-md-0">Agendamentos</h4>
                <div class="d-flex align-items-center gap-2">
                    <select v-model="filterStatus" class="form-select form-select-sm w-auto">
                        <option value="">Todos</option>
                        <option value="adiado">Adiado</option>
                        <option value="despachado">Despachado</option>
                    </select>
                    <button class="btn btn-sm btn-danger" @click="toggleActionsMenu">
                        <span class="material-symbols-rounded">delete</span> Limpar
                    </button>
                </div>
            </div>
        </div>

        <transition name="slide-fade">
            <div v-if="showActionsMenu" class="actions-menu p-3 mb-3">
                <button class="btn btn-outline-danger d-flex align-items-center gap-1"
                    @click="clearAppointments('all')">
                    <span class="material-symbols-rounded">delete_forever</span> Todo Período
                </button>
            </div>
        </transition>

        <div v-if="filteredAppointments.length > 0" class="appointments-list">
            <div class="card appointment-card mb-3" v-for="appointment in filteredAppointments" :key="appointment.id">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div class="d-flex flex-column">
                        <h5 class="card-title"><strong>{{ appointment.name }}</strong></h5>
                        <p class="text-muted mb-2"><strong>Contato:</strong> {{ appointment.phone }}</p>
                        <p class="text-muted mb-2"><strong>Serviço:</strong> {{ appointment.service }}</p>
                        <p class="text-muted mb-2"><strong>Data:</strong> {{ formatDate(appointment.dayDate) }}</p>
                        <p class="text-muted mb-2"><strong>Horário:</strong> {{ appointment.time }}</p>
                        <span :class="getStatusClass(appointment.status)" class="status-badge">{{ appointment.status
                            }}</span>
                    </div>
                    <button class="btn btn-sm btn-icon" @click="toggleDropdown(appointment.id)">
                        <span class="material-symbols-rounded">more_vert</span>
                    </button>
                </div>

                <transition name="fade">
                    <div v-if="dropdownAppointmentId === appointment.id"
                        class="menu-options d-flex justify-content-around py-2">
                        <button class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                            @click="openDeferModal(appointment)">
                            <span class="material-symbols-rounded">schedule</span> Adiar
                        </button>
                        <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                            @click="cancelAppointment(appointment.id)">
                            <span class="material-symbols-rounded">cancel</span> Cancelar atendimento
                        </button>
                    </div>
                </transition>
            </div>
        </div>

        <NothingHere v-else />

        <DeferModal v-if="isDeferModalOpen" :appointment="deferAppointmentData" @close="closeDeferModal"
            @confirm="deferAppointment" />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { collection, onSnapshot, query, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebaseConfig.js';
import { useAlert } from '@/stores/alert';
import NothingHere from '@/components/NothingHere.vue';
import DeferModal from '@/components/DeferModal.vue';

const appointments = ref([]);
const dropdownAppointmentId = ref(null);
const isDeferModalOpen = ref(false);
const deferAppointmentData = ref(null);
const showActionsMenu = ref(false);
const alert = useAlert();
const filterStatus = ref('');

const filteredAppointments = computed(() => {
    if (!filterStatus.value) {
        return appointments.value;
    }
    return appointments.value.filter(appointment => appointment.status === filterStatus.value);
});

const loadAppointments = () => {
    try {
        const q = query(collection(db, 'bookings'));
        onSnapshot(q, (querySnapshot) => {
            appointments.value = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    phone: data.phone,
                    service: data.service,
                    dayDate: data.dayDate,
                    time: data.time,
                    status: data.status,
                };
            });
        });

    } catch (error) {
        alert.show('Erro ao carregar agendamentos.', 500);
        console.error('Erro ao carregar agendamentos:', error);
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';

    const dateValue = new Date(dateString + 'T00:00:00-03:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Sao_Paulo' };
    return dateValue.toLocaleDateString('pt-BR', options);
};

const clearAppointments = async (filter) => {
    try {
        const now = new Date();
        let filteredList = [];

        if (filter === 'hour') {
            const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
            filteredList = appointments.value.filter(app => new Date(app.dayDate + 'T' + app.time) <= oneHourAgo);
        } else if (filter === 'month') {
            const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
            filteredList = appointments.value.filter(app => new Date(app.dayDate) <= oneMonthAgo);
        } else if (filter === 'all') {
            filteredList = appointments.value;
        }

        if (filteredList.length === 0) {
            alert.show('Nenhum agendamento para limpar.', 300);
            return;
        }

        const batch = writeBatch(db);
        filteredList.forEach(appointment => {
            const docRef = doc(db, 'bookings', appointment.id);
            batch.delete(docRef);
        });

        await batch.commit();
        appointments.value = appointments.value.filter(app => !filteredList.some(filteredApp => filteredApp.id === app.id));
        alert.show('Agendamentos excluídos com sucesso!', 200);
    } catch (error) {
        alert.show('Erro ao limpar agendamentos.', 500);
        console.error('Erro ao limpar agendamentos:', error);
    }
};

const getStatusClass = (status) => {
    return {
        'status-adiado': status === 'adiado',
        'status-despachado': status === 'despachado',
    };
};

const toggleDropdown = (appointmentId) => {
    dropdownAppointmentId.value = dropdownAppointmentId.value === appointmentId ? null : appointmentId;
};

const openDeferModal = (appointment) => {
    deferAppointmentData.value = appointment;
    isDeferModalOpen.value = true;
};

const closeDeferModal = () => {
    isDeferModalOpen.value = false;
};

const deferAppointment = async ({ id, newDate }) => {
    try {
        const docRef = doc(db, 'bookings', id);
        await updateDoc(docRef, { status: 'adiado', day: newDate.day, time: newDate.time });
        appointments.value = appointments.value.map(app => app.id === id ? { ...app, status: 'adiado', day: newDate.day, time: newDate.time } : app);
        alert.show('Agendamento adiado com sucesso!', 200);
        closeDeferModal();
    } catch (error) {
        alert.show('Erro ao adiar agendamento.', 500);
        console.error('Erro ao adiar agendamento:', error);
    }
};

const cancelAppointment = async (id) => {
    try {
        const docRef = doc(db, 'bookings', id);
        await updateDoc(docRef, { status: 'despachado' });
        appointments.value = appointments.value.map(app => app.id === id ? { ...app, status: 'despachado' } : app);
        alert.show('Agendamento despachado com sucesso!', 200);
    } catch (error) {
        alert.show('Erro ao despachar agendamento.', 500);
        console.error('Erro ao despachar agendamento:', error);
    }
};

const toggleActionsMenu = () => {
    showActionsMenu.value = !showActionsMenu.value;
};

onMounted(loadAppointments);
</script>

<style scoped>
.header {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 0.5rem;
}

.title {
    color: #333;
}

.actions-menu {
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    background-color: #f1f1f1;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.appointment-card {
    border-radius: 0.5rem;
    box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1);
    background-color: #ffffff;
}

.menu-options {
    border-top: 1px solid #eee;
}

.btn-icon {
    background: transparent;
    border: none;
    color: #555;
    padding: 0;
    font-size: 1.5rem;
}

.btn-icon:hover {
    color: #000;
}

.status-badge {
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: bold;
}

.status-adiado {
    background-color: #ffc107;
    color: #fff;
}

.status-despachado {
    background-color: #28a745;
    color: #fff;
}

.btn-primary {
    background-color: #007bff;
    border-color: #007bff;
}

.btn-primary:hover {
    background-color: #0056b3;
    border-color: #0056b3;
}

.btn-danger {
    background-color: #dc3545;
    border-color: #dc3545;
}

.btn-danger:hover {
    background-color: #c82333;
    border-color: #bd2130;
}
</style>
