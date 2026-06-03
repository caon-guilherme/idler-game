<script setup>
import { ref, onMounted } from 'vue'

const visible = ref(true)

onMounted(() => {
  setTimeout(() => {
    visible.value = false
  }, 1200)
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" id="loading-screen">
      <div class="spinner"></div>
      <div class="loading-text">CARREGANDO RPG...</div>
    </div>
  </Transition>
</template>

<style>
#loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-leave-to {
  opacity: 0;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(107, 76, 42, 0.2);
  border-left-color: var(--accent-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.15);
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--accent-gold);
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  letter-spacing: 2px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
