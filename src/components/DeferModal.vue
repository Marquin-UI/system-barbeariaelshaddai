<template>
  <div class="modal-overlay" @click.self="emitClose">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Adiar Agendamento</h5>
      </div>
      <div class="modal-body">
        <label for="daySelect" class="form-label">Selecione um dia:</label>
        <select id="daySelect" class="form-select" v-model="selectedDay" @change="fetchAvailableTimes">
          <option value="" disabled>Escolha um dia</option>
          <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
        </select>

        <label for="timeSelect" class="form-label mt-3">Selecione um horário:</label>
        <select id="timeSelect" class="form-select" v-model="selectedTime">
          <option value="" disabled>Escolha um horário</option>
          <option v-for="time in availableTimes" :key="time" :value="time">{{ time }}</option>
        </select>
      </div>
      <div class="modal-footer gap-2">
        <button class="btn btn-primary d-flex align-items-center justify-content-center gap-1 btn-sm"
          @click="confirmDefer"><span class="material-symbols-rounded fs-5 ">
            check
          </span>Confirmar</button>
        <button class="btn btn-warning d-flex align-items-center justify-content-center gap-1 btn-sm"
          @click="emitClose"><span class="material-symbols-rounded fs-5 ">
            cancel
          </span>Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '@/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAlert } from '@/stores/alert';

const props = defineProps({
  appointment: Object,
  close: Function,
});

const emit = defineEmits(['confirm', 'close']);

const alert = useAlert();
const days = ref([]);
const availableTimes = ref([]);
const selectedDay = ref(null);
const selectedTime = ref(null);

// Função para buscar dias disponíveis
const fetchDays = async () => {
  try {
    const docRef = doc(db, 'barbershop', 'dailySchedule');
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
      const schedule = docSnapshot.data().schedule || [];
      const uniqueDays = [...new Set(schedule.map(day => day.day))];
      days.value = uniqueDays;
    } else {
      alert.show('Documento de horários não encontrado!', 'error');
    }
  } catch (error) {
    alert.show('Erro ao buscar dias disponíveis.', 'error');
  }
};

const fetchAvailableTimes = async () => {
  if (!selectedDay.value) {
    availableTimes.value = []; // Limpa a lista de horários disponíveis
    return;
  }

  try {
    const docRef = doc(db, 'barbershop', 'dailySchedule');
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
      const schedule = docSnapshot.data().schedule || [];
      const daySchedule = schedule.find(day => day.day === selectedDay.value);
      availableTimes.value = daySchedule?.availableTimes
        ? Object.entries(daySchedule.availableTimes)
          .filter(([, info]) => !info.isBooked)
          .map(([time]) => time)
          .sort()
        : [];
    } else {
      alert.show('Documento de horários não encontrado!', 'error');
    }
  } catch (error) {
    alert.show('Erro ao buscar horários disponíveis.', 'error');
  }   
};


const confirmDefer = async () => {
  if (!selectedDay.value || !selectedTime.value) {
    alert.show('Por favor, selecione um dia e horário válidos.', 'error');
    return;
  }

  try {
    const docRef = doc(db, 'barbershop', 'dailySchedule');
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const schedule = docSnapshot.data().schedule || [];
      const oldDaySchedule = schedule.find(day => day.day === props.appointment.day);
      const newDaySchedule = schedule.find(day => day.day === selectedDay.value);

      if (oldDaySchedule) {
        const oldTimeSlot = oldDaySchedule.availableTimes[props.appointment.time];
        if (oldTimeSlot) {
          oldTimeSlot.isBooked = false; // Desmarca o horário antigo como não reservado
        }
      }

      const newTimeSlot = newDaySchedule.availableTimes[selectedTime.value];
      if (newTimeSlot) {
        if (newTimeSlot.isBooked) {
          alert.show('O horário selecionado já está reservado. Por favor, escolha outro horário.', 'error');
          return;
        }
        newTimeSlot.isBooked = true; // Marca o novo horário como reservado
      }

      await updateDoc(docRef, { schedule });

      emit('confirm', { id: props.appointment.id, newDate: { day: selectedDay.value, time: selectedTime.value } });
      alert.show('Agendamento adiado com sucesso!', 'success');
    } else {
      alert.show('Documento de horários não encontrado!', 'error');
    }
  } catch (error) {
    alert.show('Erro ao adiantar agendamento.', 'error');
    console.error('Erro ao adiar agendamento:', error);
  }
};


// Carregar os dias disponíveis ao montar o componente
onMounted(() => {
  fetchDays();
});
const emitClose = () => {
  emit('close'); // Emit the 'close' event to the parent component
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  /* Para garantir que o modal fique acima de outros elementos */
}

.modal-content {
  background-color: #fff;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  /* Limita a largura máxima do modal */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 1rem;
}

.modal-title {
  font-size: 1.5rem;
  color: #333;
  /* Cor do título */
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
}

.btn-close:hover {
  color: #333;
  /* Cor ao passar o mouse */
}

.modal-body {
  margin-top: 1rem;
}

.form-label {
  font-weight: bold;
  /* Torna o texto do rótulo mais legível */
}

.form-select {
  margin-top: 0.5rem;
  /* Adiciona espaço entre o rótulo e o select */
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
