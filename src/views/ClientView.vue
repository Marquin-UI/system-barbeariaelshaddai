<template>
  <div class="container">
    <h1 class="text-center primary mb-3">Área de Agendamento</h1>

    <div class="availability-section mb-5">
      <AvailableTime @select="selectTime" @selectDay="selectDay" @selectService="selectService"
        :reset="resetSelection" />
    </div>

    <div v-if="selectedTime && selectedDay && selectedService" class="booking-form-section">
      <h2 class="text primary mb-3">Complete seu agendamento</h2>
      <BookingForm :selectedDay="selectedDay" :selected-service="selectedService" :selectedTime="selectedTime"
        @submit="bookAppointment" @close="handleClose" />
    </div>

    <div v-else class="alert alert-warning text-center d-flex align-items-center justify-content-center gap-1">
      <span class="material-symbols-rounded">info</span>
      Selecione um horário antes de preencher o formulário.
    </div>

    <div class="my-5">
      <h2 class="text primary mb-3">Seu último Agendamento</h2>
      <ul class="list-group">
        <li v-for="appointment in appointments" :key="appointment.id" class="list-group-item">
          <strong>{{ formatDate(appointment.dayDate) }}</strong> às {{ appointment.time }}
          <span class="text-success">{{ appointment.status }}</span>
        </li>
      </ul>
      <div v-if="appointments.length === 0"
        class="alert alert-info text-center mt-3 d-flex align-items-center gap-1 justify-content-center">
        <span class="material-symbols-rounded">calendar_today</span>
        Você ainda não tem agendamentos.
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import AvailableTime from '@/components/AvailableTimes.vue';
import BookingForm from '@/components/BookingForm.vue';
import { useAlert } from '@/stores/alert';
import { db } from '@/firebaseConfig.js';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore'; // Importa o userStore

const selectedTime = ref(null);
const selectedDay = ref(null);
const selectedService = ref(null);
const resetSelection = ref(false);
const appointments = ref([]);
const userStore = useUserStore(); // Inicializa o userStore

const selectDay = (day) => {
  selectedDay.value = day;
};

const selectTime = (time) => {
  selectedTime.value = time;
};

const selectService = (service) => {
  selectedService.value = service;
};


const handleClose = (payload) => {
  if (payload.clearSelection) {
    selectedDay.value = null;
    selectedTime.value = null;
    selectedService.value = null;
    resetSelection.value = true;
  }
};

const bookAppointment = (appointmentDetails) => {
  useAlert().show('Agendamento enviado com sucesso, aguardando a confirmação!', 200, appointmentDetails);
};

const loadAppointments = () => {
  const userId = userStore.user?.id; // Obtém o ID do usuário logado
  if (userId) {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId));

    onSnapshot(q, (querySnapshot) => {
      appointments.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(appointments.value); // Log dos agendamentos
    });
  } else {
    console.error('Usuário não está autenticado ou ID do usuário não encontrado.');
  }
};

onMounted(loadAppointments);

watch(resetSelection, (newVal) => {
  if (newVal) {
    resetSelection.value = false;
  }
});

// Função para formatar a data
const formatDate = (dateString) => {
  const dateValue = new Date(dateString + 'T00:00:00-03:00');
  return dateValue.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};
</script>

<style scoped>
.container {
  margin-top: 20px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.alert {
  font-size: 0.8rem;
}
</style>