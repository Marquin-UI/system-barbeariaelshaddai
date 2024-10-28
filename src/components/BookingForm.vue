<template>
  <div class="card mb-5">
    <div class="card-body">
      <form v-if="localSelectedTime" @submit.prevent="submitForm">
        <div class="mb-4">
          <label for="name" class="form-label">Nome</label>
          <input v-model="formData.name" type="text" class="form-control" id="name" required />
        </div>
        <div class="mb-3">
          <label for="phone" class="form-label">Telefone</label>
          <input v-model="formData.phone" type="text" class="form-control" id="phone" required
            v-mask="['(##) ####-####', '(##) #####-####']" />
        </div>
        <div class="mb-3">
          <label for="selectedDay" class="form-label">Dia Selecionado</label>
          <input type="text" class="form-control" id="selectedDay" disabled
            :value="localSelectedDay ? formatDayWithDate(localSelectedDay.day, localSelectedDay.dayDate) : 'Dia inválido'" />
        </div>
        <div class="mb-3">
          <label for="selectedTime" class="form-label">Horário Selecionado</label>
          <input type="text" class="form-control" id="selectedTime" disabled :value="localSelectedTime" />
        </div>
        <div class="mb-3">
          <label for="selectedService" class="form-label">Serviço Selecionado</label>
          <input type="text" class="form-control" id="selectedService" disabled
            :value="localSelectedService ? localSelectedService.title : 'Serviço inválido'" />
        </div>
        <button type="submit" class="btn btn-primary d-flex align-items-center gap-1 mt-4">
          {{ isEditing.value && !isAttended.value ? 'Atualizar Agendamento' : 'Confirmar Agendamento' }}
          <span class="material-symbols-rounded fs-5">{{ isEditing.value && !isAttended.value ? 'edit' : 'check' }}</span>
        </button>
      </form>
      <p v-else>Selecione um horário para agendar.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { db } from '@/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useAlert } from '@/stores/alert';
import { useUserStore } from '@/stores/userStore';
import dayjs from 'dayjs';

const emit = defineEmits(['clearSelection']);
const alert = useAlert();
const userStore = useUserStore();
const props = defineProps(['selectedDay', 'selectedTime', 'selectedService', 'editingAppointment']);
const isEditing = computed(() => !!props.editingAppointment);

const isAttended = computed(() => {
  const attendedStatus = props.editingAppointment ? props.editingAppointment.status : null;
  return attendedStatus === 'attended';
});

const formData = ref({
  name: '',
  phone: ''
});

const localSelectedDay = ref(props.selectedDay);
const localSelectedTime = ref(props.selectedTime?.time || null);
const localSelectedService = ref(props.selectedService || null);

const previousTime = ref(localSelectedTime.value);

watch(() => props.selectedDay, (newValue) => {
  localSelectedDay.value = newValue;
});

watch(() => props.selectedTime, (newValue) => {
  localSelectedTime.value = newValue?.time || null;
  previousTime.value = newValue?.time;
});

watch(() => props.selectedService, (newValue) => {
  localSelectedService.value = newValue || null;
});

const fetchUserData = async () => {
  const userId = userStore.user?.id;
  if (userId) {
    try {
      const userDocRef = doc(db, 'clients', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        formData.value.name = userData.name || '';
        formData.value.phone = userData.phone || '';
      } else {
        alert.show('Usuário não encontrado no Firestore.', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      alert.show('Erro ao buscar dados do usuário.', 'error');
    }
  } else {
    alert.show('Nenhum usuário autenticado.', 'error');
  }
};

onMounted(() => {
  fetchUserData();
});

const formatDayWithDate = (day, date) => {
  const parsedDate = new Date(date + 'T00:00:00');
  const options = { day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' };
  return `${day}, ${parsedDate.toLocaleDateString('pt-BR', options)}`;
};

const submitForm = async () => {
  if (!localSelectedTime.value) {
    alert.show('Por favor, selecione um horário.', 'error');
    return;
  }

  try {
    const userId = userStore.user?.id;
    if (!userId) {
      alert.show('Usuário não autenticado.', 'error');
      return;
    }

    const serviceName = localSelectedService.value ? localSelectedService.value.title : null;
    if (!serviceName) {
      alert.show('Serviço não selecionado.', 'error');
      return;
    }

    const bookingData = {
      ...formData.value,
      day: localSelectedDay.value.day,
      dayDate: localSelectedDay.value.dayDate,
      time: localSelectedTime.value,
      service: serviceName,
      userId: userId,
      isEditing: isEditing.value,
      status: props.editingAppointment ? props.editingAppointment.status : null,
      isAttended: isAttended.value
    };

    const bookingRef = doc(db, 'bookings', props.editingAppointment ? props.editingAppointment.id : userId);

    if (props.editingAppointment) {
      // Verifica se o agendamento foi atendido
      if (!isAttended.value) {
        // Libera o horário que estava agendado
        await releasePreviousTime(previousTime.value, localSelectedDay.value.dayDate);
        
        // Atualiza o agendamento
        await updateDoc(bookingRef, {
          ...bookingData,
          isAttended: false // Garantindo que ao editar, isAttended seja false
        });
        alert.show('Agendamento atualizado com sucesso!', 'success');
      } else {
        // Se o agendamento foi atendido, trata como novo agendamento
        await setDoc(bookingRef, bookingData);
        alert.show('Novo agendamento confirmado!', 'success');
      }
    } else {
      // Se não for edição, cria um novo agendamento
      await setDoc(bookingRef, bookingData);
      alert.show('Agendamento confirmado!', 'success');
    }

    await updateAvailableTimes();

    formData.value = { name: '', phone: '' };
    localSelectedTime.value = null;
    emit('clearSelection');

  } catch (error) {
    alert.show('Erro ao confirmar agendamento: ' + error.message, 'error');
    console.error('Erro ao confirmar agendamento:', error);
  }
};

const releasePreviousTime = async (time, dayDate) => {
  const docRef = doc(db, 'barbershop', 'dailySchedule');
  const docSnapshot = await getDoc(docRef);
  const schedule = docSnapshot.data().schedule || [];

  const dayIndex = schedule.findIndex(o => o.day === dayjs(dayDate).format('dddd'));
  const day = schedule[dayIndex];

  if (day && day.availableTimes[time]) {
    day.availableTimes[time].isBooked = false; // Libera o horário
    schedule[dayIndex] = day;
    await updateDoc(docRef, { schedule });
  }
};

const updateAvailableTimes = async () => {
  const docRef = doc(db, 'barbershop', 'dailySchedule');
  const docSnapshot = await getDoc(docRef);
  const schedule = docSnapshot.data().schedule || [];

  const dayIndex = schedule.findIndex(o => {
    return o.day === localSelectedDay.value.day && o.availableTimes[localSelectedTime.value];
  });

  if (dayIndex === -1) {
    alert.show('Agendamento não encontrado.', 'error');
    return;
  }

  const day = schedule[dayIndex];
  const serviceDuration = localSelectedService.value.duration;

  if (serviceDuration < 40) {
    const newDate = dayjs(dayjs().format('YYYY-MM-DD ') + localSelectedTime.value)
      .add(serviceDuration, 'minute').format('HH:mm');

    day.availableTimes[newDate] = { isBooked: false };
    day.availableTimes[localSelectedTime.value].isBooked = true;
  } else {
    const requiredSlots = Math.ceil(serviceDuration / 40);
    for (let i = 0; i < requiredSlots; i++) {
      const nextTime = dayjs(dayjs().format('YYYY-MM-DD ') + localSelectedTime.value)
        .add(i * 40, 'minute').format('HH:mm');

      if (day.availableTimes[nextTime]?.isBooked) {
        alert.show('Horários subsequentes já estão marcados.', 'error');
        return;
      }
    }

    for (let i = 0; i < requiredSlots; i++) {
      const nextTime = dayjs(dayjs().format('YYYY-MM-DD ') + localSelectedTime.value)
        .add(i * 40, 'minute').format('HH:mm');
      day.availableTimes[nextTime].isBooked = true;
    }
  }

  schedule[dayIndex] = day;
  await updateDoc(docRef, { schedule });
};
</script>

<style scoped>
.card {
  margin-top: 20px;
}
</style>


