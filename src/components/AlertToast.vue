<script setup>
import { useAlert } from '@/stores/alert';
import { computed, ref, watch } from 'vue';

const alert = useAlert()

function getTitle() {
  if (alert.status >= 500) {
    return ['Erro', 'bg-danger']
  }

  if (alert.status >= 300) {
    return ['Alerta', 'bg-warning']
  }

  if (alert.status >= 200) {
    return ['Sucesso', 'bg-success']
  }

  return ['Mensagem', 'bg-info']
}

const information = computed(() => getTitle())

const time = 7
const momentum = time * 1000
const delay = 300

const pos = ref(0)
const timeout = ref()
const interval = ref()

watch(() => alert.visible, (newval) => {
  if (newval) {
    interval.value = setInterval(() => {
      pos.value += 1
    }, (momentum - delay) / 100)
    timeout.value = setTimeout(() => {
      alert.hide()
      pos.value = 0
      clearInterval(interval.value)
    }, momentum)
  }
})

function btnClose() {
  alert.hide()
  pos.value = 0
  clearTimeout(timeout.value)
  clearInterval(interval.value)
}
</script>

<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div id="alert" class="toast show" :class="{ 'active': alert.visible }" role="alert" aria-live="assertive"
      aria-atomic="true">
      <div class="toast-header px-3 border-0">
        <strong class="me-auto">{{ information[0] }}</strong>
        <button @click="btnClose" type="button" class="btn-close" aria-label="Close"></button>
      </div>
      <div class="toast-body p-0 overflow-hidden">
        <span class="progress" style="height: 3px;">
          <span :class="information[1]" :style="{ 'width': `${pos}%`, 'transition': `all ${delay}ms` }"></span>
        </span>
        <div class="p-3">
          <div class="fs-6 m-0 alert-message" style="font-family: 'Inter';">{{ alert.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast {
  border-radius: 16px;
  border: 0;
}

#alert {
  opacity: 0;
  visibility: hidden;
  transition: 200ms;
}

#alert.active {
  opacity: 1;
  visibility: visible;
}

.alert-message {
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>